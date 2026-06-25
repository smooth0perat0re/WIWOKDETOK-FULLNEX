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
        const assigneeId = data.assignee_id ? parseInt(data.assignee_id, 10) : null;

        const task = await prisma.tasks.findUnique({ where: { id: taskId } });
        if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.$transaction(async (tx: any) => {
            await tx.tasks.update({
                where: { id: taskId },
                data: { assignee_id: assigneeId }
            });

            if (assigneeId && assigneeId !== user.user_id) {
                await tx.notifications.create({
                    data: {
                        user_id: assigneeId,
                        title: 'Task Assigned',
                        message: `You have been assigned to task: ${task.title}`,
                        type: 'task_assignment'
                    }
                });
            }
        });

        let assigneeName = 'Unassigned';
        if (assigneeId) {
            const assigneeUser = await prisma.users.findUnique({
                where: { id: assigneeId },
                select: { name: true }
            });
            if (assigneeUser) assigneeName = assigneeUser.name;
        }

        await logActivity(user.user_id, `Assigned task to ${assigneeName}`, taskId, task.title);

        return NextResponse.json({ message: 'Assignee updated successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Update assignee failed: ' + e.message }, { status: 500 });
    }
}
