import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function DELETE(request: Request, context: { params: Promise<{ workspace_id: string, project_id: string, user_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id, user_id } = await context.params;
    const projectId = parseInt(project_id, 10);
    const targetUserId = parseInt(user_id, 10);
    if (isNaN(projectId) || isNaN(targetUserId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        await prisma.project_members.deleteMany({
            where: {
                project_id: projectId,
                user_id: targetUserId
            }
        });

        return NextResponse.json({ message: 'Member removed successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to remove member: ' + e.message }, { status: 500 });
    }
}
