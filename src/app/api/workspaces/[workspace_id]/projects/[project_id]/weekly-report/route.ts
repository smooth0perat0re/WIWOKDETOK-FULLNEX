import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ workspace_id: string, project_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id } = await context.params;
    const projectId = parseInt(project_id, 10);
    if (isNaN(projectId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    const url = new URL(request.url);
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const startDateStr = url.searchParams.get('start') || sixDaysAgo.toISOString().split('T')[0];
    const endDateStr = url.searchParams.get('end') || new Date().toISOString().split('T')[0];

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    try {
        const report = await prisma.task_status_history.findMany({
            where: {
                changed_by: user.user_id,
                tasks: {
                    project_id: projectId
                },
                to_status: 'done',
                changed_at: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                tasks: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: {
                changed_at: 'desc'
            }
        });

        const formattedReport = report.map((r: any) => ({
            id: r.tasks?.id,
            title: r.tasks?.title,
            completed_at: r.changed_at
        }));

        return NextResponse.json({ report: formattedReport });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to get weekly project report: ' + e.message }, { status: 500 });
    }
}
