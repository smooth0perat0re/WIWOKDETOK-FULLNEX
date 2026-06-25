import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { resolveWorkspaceId } from '@/lib/workspace-helper';

export async function PUT(request: Request, context: { params: Promise<{ workspace_id: string, project_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id, project_id } = await context.params;
    const workspaceId = await resolveWorkspaceId(workspace_id);
    const projectId = parseInt(project_id, 10);
    
    if (!workspaceId || isNaN(projectId)) {
        return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const projectMember = await prisma.project_members.findFirst({
        where: { project_id: projectId, user_id: user.user_id }
    });
    
    if (!projectMember) {
        const workspaceMember = await prisma.workspace_members.findUnique({
            where: {
                workspace_id_user_id: {
                    workspace_id: workspaceId,
                    user_id: user.user_id
                }
            }
        });
        if (!workspaceMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const data = await request.json();
        
        const updates: any = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.description !== undefined) updates.description = data.description;
        if (data.status !== undefined) updates.status = data.status;
        if (data.icon !== undefined) updates.icon = data.icon;
        if (data.chained_ticket !== undefined) updates.chained_ticket = data.chained_ticket;

        if (Object.keys(updates).length > 0) {
            await prisma.projects.update({
                where: { id: projectId },
                data: updates
            });
        }

        return NextResponse.json({ message: 'Project updated successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Update failed: ' + e.message }, { status: 500 });
    }
}
