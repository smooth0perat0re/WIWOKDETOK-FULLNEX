import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { resolveWorkspaceId } from '@/lib/workspace-helper';

export async function POST(request: Request, context: { params: Promise<{ workspace_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id } = await context.params;
    const workspaceId = await resolveWorkspaceId(workspace_id);
    if (!workspaceId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    try {
        const body = await request.json();
        const username = body.username || '';

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const existingMember = await prisma.workspace_members.findFirst({
            where: {
                workspace_id: workspaceId,
                users: {
                    email: username
                }
            }
        });

        if (existingMember) {
            return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 });
        }

        const existingInvite = await prisma.workspace_invitations.findFirst({
            where: {
                workspace_id: workspaceId,
                invitee_username: username
            }
        });

        if (existingInvite) {
            await prisma.workspace_invitations.update({
                where: { id: existingInvite.id },
                data: {
                    status: 'pending',
                    created_at: new Date()
                }
            });
        } else {
            await prisma.workspace_invitations.create({
                data: {
                    workspace_id: workspaceId,
                    inviter_id: user.user_id,
                    invitee_username: username,
                    status: 'pending'
                }
            });
        }

        return NextResponse.json({ message: 'Invitation sent successfully' }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to send invitation: ' + e.message }, { status: 500 });
    }
}
