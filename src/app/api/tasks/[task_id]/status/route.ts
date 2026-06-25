import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

async function logActivity(userId: number, action: string, taskId: number, taskTitle: string) {
    await prisma.recent_activities.create({
        data: {
            user_id: userId,
            action,
            target_type: 'task',
            target_id: taskId,
            target_title: taskTitle
        }
    });
}

export async function PUT(request: Request, context: { params: Promise<{ task_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_id } = await context.params;
    const taskId = parseInt(task_id, 10);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        const newStatus = data.status || '';
        const reviewerId = data.reviewer_id || null;

        if (!newStatus) return NextResponse.json({ error: 'Status required' }, { status: 400 });

        const task = await prisma.tasks.findUnique({ where: { id: taskId } });
        if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const currentStatus = task.status;
        const taskTitle = task.title;

        if (newStatus === 'done') {
            const lastReview = await prisma.task_reviews.findFirst({
                where: { task_id: taskId },
                orderBy: { created_at: 'desc' }
            });
            if (!lastReview || lastReview.status !== 'approved') {
                return NextResponse.json({ error: 'Task cannot be Done without an approved review.' }, { status: 400 });
            }
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.tasks.update({
                where: { id: taskId },
                data: { status: newStatus }
            });

            await tx.task_status_history.create({
                data: {
                    task_id: taskId,
                    from_status: currentStatus,
                    to_status: newStatus,
                    changed_by: user.user_id
                }
            });

            if (newStatus === 'in_review' && reviewerId) {
                await tx.task_reviews.create({
                    data: {
                        task_id: taskId,
                        reviewer_id: parseInt(reviewerId, 10),
                        status: 'pending'
                    }
                });

                if (reviewerId != user.user_id) {
                    await tx.notifications.create({
                        data: {
                            user_id: parseInt(reviewerId, 10),
                            title: 'Review Requested',
                            message: `You have been requested to review task: ${taskTitle}`,
                            type: 'review_request'
                        }
                    });
                }
            }
        });

        await logActivity(user.user_id, "Changed status to " + newStatus.replace(/_/g, ' '), taskId, taskTitle);

        return NextResponse.json({ message: 'Status updated successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Update failed: ' + e.message }, { status: 500 });
    }
}
