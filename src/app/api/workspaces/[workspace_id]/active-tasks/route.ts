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

    const tasks = await prisma.tasks.findMany({
        where: {
            workspace_id: workspaceId,
            assignee_id: user.user_id,
            status: 'in_progress'
        },
        include: {
            projects: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    const formattedTasks = tasks.map((t: any) => {
        const { projects, ...rest } = t;
        return {
            ...rest,
            project_name: projects?.name
        };
    });

    return NextResponse.json({ tasks: formattedTasks });
}
