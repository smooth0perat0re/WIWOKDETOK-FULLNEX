import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ workspace_id: string, project_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id } = await context.params;
    const projectId = parseInt(project_id, 10);
    if (isNaN(projectId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    const members = await prisma.project_members.findMany({
        where: { project_id: projectId },
        include: {
            users: {
                select: { name: true, email: true }
            }
        }
    });

    const formattedMembers = members.map((m: any) => ({
        id: m.id,
        project_id: m.project_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        name: m.users?.name,
        email: m.users?.email
    }));

    return NextResponse.json({ members: formattedMembers });
}

export async function POST(request: Request, context: { params: Promise<{ workspace_id: string, project_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id } = await context.params;
    const projectId = parseInt(project_id, 10);
    if (isNaN(projectId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        const userId = data.user_id;
        const role = data.role || 'member';

        if (!userId) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

        await prisma.project_members.create({
            data: {
                project_id: projectId,
                user_id: userId,
                role
            }
        });

        return NextResponse.json({ message: 'Member added successfully' }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to add member: ' + e.message }, { status: 500 });
    }
}
