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

    const members = await prisma.workspace_members.findMany({
        where: { workspace_id: workspaceId },
        include: {
            users: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            joined_at: 'asc'
        }
    });

    const formattedMembers = members.map((m: any) => ({
        id: m.users?.id,
        name: m.users?.name,
        email: m.users?.email,
        role: m.role,
        joined_at: m.joined_at
    }));

    return NextResponse.json({ members: formattedMembers });
}
