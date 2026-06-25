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

    const totalProjects = await prisma.projects.count({ where: { workspace_id: workspaceId } });
    const totalMembers = await prisma.workspace_members.count({ where: { workspace_id: workspaceId } });

    const activeTasks = await prisma.tasks.count({
        where: {
            workspace_id: workspaceId,
            OR: [
                { status: 'in_progress' },
                { 
                    status: 'in_review',
                    task_reviews: {
                        some: {
                            reviewer_id: { not: null },
                            status: 'pending'
                        }
                    }
                }
            ]
        }
    });

    return NextResponse.json({
        stats: {
            total_projects: totalProjects,
            total_members: totalMembers,
            active_tasks: activeTasks
        }
    });
}
