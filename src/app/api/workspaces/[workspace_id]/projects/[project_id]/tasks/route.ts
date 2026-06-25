import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { resolveWorkspaceId } from '@/lib/workspace-helper';

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

export async function GET(request: Request, context: { params: Promise<{ workspace_id: string, project_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id } = await context.params;
    const projectId = parseInt(project_id, 10);
    if (isNaN(projectId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    const tasks = await prisma.tasks.findMany({
        where: { project_id: projectId },
        orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ tasks });
}

export async function POST(request: Request, context: { params: Promise<{ workspace_id: string, project_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id, project_id } = await context.params;
    const workspaceId = await resolveWorkspaceId(workspace_id);
    const projectId = parseInt(project_id, 10);
    if (!workspaceId || isNaN(projectId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        const {
            title = '',
            description = '',
            priority = 'medium',
            assignee_id = null,
            ticket_reference = null,
            progress = 0,
            icon = null
        } = data;

        const task = await prisma.tasks.create({
            data: {
                workspace_id: workspaceId,
                project_id: projectId,
                title,
                description,
                priority,
                assignee_id,
                created_by: user.user_id,
                ticket_reference,
                progress: parseInt(progress as string, 10) || 0,
                icon: icon || null
            }
        });

        await logActivity(user.user_id, "Task was created", task.id, title);

        return NextResponse.json({
            message: 'Task created',
            task: { id: task.id, title: task.title }
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Creation failed: ' + e.message }, { status: 500 });
    }
}
