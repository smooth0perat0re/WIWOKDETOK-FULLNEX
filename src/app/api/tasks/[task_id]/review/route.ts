import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function PUT(request: Request, context: { params: Promise<{ task_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_id } = await context.params;
    const taskId = parseInt(task_id, 10);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        const reviewStatus = data.status || 'approved';
        const comment = data.comment || '';

        const review = await prisma.task_reviews.findFirst({
            where: {
                task_id: taskId,
                reviewer_id: user.user_id,
                status: 'pending'
            },
            orderBy: { created_at: 'desc' }
        });

        if (!review) {
            return NextResponse.json({ error: 'No pending review found for you on this task.' }, { status: 404 });
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.task_reviews.update({
                where: { id: review.id },
                data: {
                    status: reviewStatus,
                    comment: comment,
                    reviewed_at: new Date()
                }
            });

            if (reviewStatus === 'rejected') {
                await tx.tasks.update({
                    where: { id: taskId },
                    data: { status: 'not_passed' }
                });

                await tx.task_status_history.create({
                    data: {
                        task_id: taskId,
                        from_status: 'in_review',
                        to_status: 'not_passed',
                        changed_by: user.user_id
                    }
                });
            }
        });

        return NextResponse.json({ message: 'Review submitted successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Review failed: ' + e.message }, { status: 500 });
    }
}
