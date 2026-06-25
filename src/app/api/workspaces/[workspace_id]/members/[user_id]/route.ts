import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { resolveWorkspaceId, checkWorkspaceAccess } from '@/lib/workspace-helper';

export async function DELETE(request: Request, context: { params: Promise<{ workspace_id: string, user_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id, user_id } = await context.params;
    const workspaceId = await resolveWorkspaceId(workspace_id);
    const targetUserId = parseInt(user_id, 10);
    
    if (!workspaceId || isNaN(targetUserId)) {
        return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const hasAccess = await checkWorkspaceAccess(workspaceId, user.user_id);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        await prisma.workspace_members.delete({
            where: {
                workspace_id_user_id: {
                    workspace_id: workspaceId,
                    user_id: targetUserId
                }
            }
        });
        return NextResponse.json({ message: 'Member removed successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to remove member: ' + e.message }, { status: 500 });
    }
}
