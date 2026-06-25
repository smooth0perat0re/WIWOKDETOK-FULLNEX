import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userEmail = user.email;
    const usernamePart = userEmail.split('@')[0];

    const invitations = await prisma.workspace_invitations.findMany({
        where: {
            status: 'pending',
            OR: [
                { invitee_username: userEmail },
                { invitee_username: usernamePart }
            ]
        },
        include: {
            workspaces: { select: { name: true } },
            users: { select: { name: true } } // inviter
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    const formattedInvitations = invitations.map((inv: any) => ({
        id: inv.id,
        workspace_id: inv.workspace_id,
        status: inv.status,
        created_at: inv.created_at,
        workspace_name: inv.workspaces?.name,
        inviter_name: inv.users?.name
    }));

    return NextResponse.json({ invitations: formattedInvitations });
}
