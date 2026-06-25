import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { resolveWorkspaceId, checkWorkspaceAccess } from '@/lib/workspace-helper';

export async function GET(request: Request, context: { params: Promise<{ workspace_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id } = await context.params;
    const workspaceId = await resolveWorkspaceId(workspace_id);
    if (!workspaceId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const hasAccess = await checkWorkspaceAccess(workspaceId, user.user_id);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const workspaceTasks = await prisma.tasks.findMany({
        where: { workspace_id: workspaceId },
        select: { id: true }
    });
    const taskIds = workspaceTasks.map((t: any) => t.id);

    const activities = await prisma.recent_activities.findMany({
        where: {
            target_type: 'task',
            target_id: { in: taskIds }
        },
        include: {
            users: {
                select: { name: true }
            }
        },
        orderBy: {
            created_at: 'desc'
        },
        take: 50
    });

    const formattedActivities = activities.map((a: any) => {
        const { users, ...rest } = a;
        return {
            ...rest,
            user_name: users?.name
        };
    });

    return NextResponse.json({ activities: formattedActivities });
}
