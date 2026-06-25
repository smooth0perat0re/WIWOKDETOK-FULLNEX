import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ task_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_id } = await context.params;
    const taskId = parseInt(task_id, 10);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const activities = await prisma.recent_activities.findMany({
            where: {
                target_type: 'task',
                target_id: taskId
            },
            include: {
                users: {
                    select: { name: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const formattedActivities = activities.map((a: any) => {
            const { users, ...rest } = a;
            return {
                ...rest,
                user_name: users?.name
            };
        });

        return NextResponse.json({ activities: formattedActivities });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to get activities: ' + e.message }, { status: 500 });
    }
}
