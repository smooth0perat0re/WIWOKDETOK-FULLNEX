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
        
        const task = await prisma.tasks.findUnique({ where: { id: taskId } });
        if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const updates: any = {};
        const activities: string[] = [];

        if (data.title !== undefined && data.title !== task.title) {
            updates.title = data.title;
            activities.push("Updated title");
        }
        if (data.description !== undefined && data.description !== task.description) {
            updates.description = data.description;
            activities.push("Updated description");
        }
        if (data.priority !== undefined && data.priority !== task.priority) {
            updates.priority = data.priority;
            activities.push("Changed priority to " + data.priority);
        }
        if (data.progress !== undefined && parseInt(data.progress, 10) !== task.progress) {
            updates.progress = parseInt(data.progress, 10);
            activities.push("Updated progress to " + updates.progress + "%");
        }
        if (data.icon !== undefined && data.icon !== task.icon) {
            updates.icon = data.icon || null;
            activities.push("Updated task icon");
        }
        if (data.chained_ticket !== undefined && data.chained_ticket !== task.chained_ticket) {
            updates.chained_ticket = data.chained_ticket;
            activities.push("Updated chained ticket");
        }
        if (data.tags !== undefined && data.tags !== task.tags) {
            updates.tags = data.tags;
            activities.push("Updated tags");
        }

        if (Object.keys(updates).length > 0) {
            await prisma.tasks.update({
                where: { id: taskId },
                data: updates
            });

            const currentTitle = updates.title || task.title;
            for (const act of activities) {
                await logActivity(user.user_id, act, taskId, currentTitle);
            }
        }

        return NextResponse.json({ message: 'Task updated successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Update failed: ' + e.message }, { status: 500 });
    }
}
