import { prisma } from '@/lib/prisma';

export async function resolveWorkspaceId(workspaceIdOrSlug: string): Promise<number | null> {
    if (!workspaceIdOrSlug) return null;
    
    // Check if it's purely numeric
    if (/^\d+$/.test(workspaceIdOrSlug)) {
        return parseInt(workspaceIdOrSlug, 10);
    }
    
    // Otherwise it's a slug
    const ws = await prisma.workspaces.findUnique({
        where: { slug: workspaceIdOrSlug },
        select: { id: true }
    });
    
    return ws ? ws.id : null;
}

export async function checkWorkspaceAccess(workspaceId: number, userId: number): Promise<boolean> {
    const check = await prisma.workspace_members.findUnique({
        where: {
            workspace_id_user_id: {
                workspace_id: workspaceId,
                user_id: userId
            }
        }
    });
    return !!check;
}
