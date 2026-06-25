import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const invitationId = parseInt(id, 10);
    if (isNaN(invitationId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        const status = data.status || '';

        if (!['accepted', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await prisma.$transaction(async (tx: any) => {
            const invitation = await tx.workspace_invitations.update({
                where: { id: invitationId },
                data: { status }
            });

            if (status === 'accepted') {
                await tx.workspace_members.upsert({
                    where: {
                        workspace_id_user_id: {
                            workspace_id: invitation.workspace_id!,
                            user_id: user.user_id
                        }
                    },
                    update: {},
                    create: {
                        workspace_id: invitation.workspace_id!,
                        user_id: user.user_id,
                        role: 'member'
                    }
                });
            }
        });

        return NextResponse.json({ message: `Invitation ${status}` });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to respond: ' + e.message }, { status: 500 });
    }
}
