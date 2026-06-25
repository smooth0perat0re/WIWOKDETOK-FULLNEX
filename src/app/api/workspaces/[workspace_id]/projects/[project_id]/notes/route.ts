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

    try {
        const notes = await prisma.project_notes.findMany({
            where: { project_id: projectId },
            include: {
                users: {
                    select: { name: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const formattedNotes = notes.map((n: any) => {
            const { users, ...rest } = n;
            return {
                ...rest,
                created_by_name: users?.name
            };
        });

        return NextResponse.json({ notes: formattedNotes });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to get project notes: ' + e.message }, { status: 500 });
    }
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
        const { title, content = null, attachment_url = null } = data;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const note = await prisma.project_notes.create({
            data: {
                project_id: projectId,
                title,
                content,
                attachment_url,
                created_by: user.user_id
            },
            include: {
                users: {
                    select: { name: true }
                }
            }
        });

        const formattedNote = {
            ...note,
            created_by_name: note.users?.name
        };
        // @ts-ignore
        delete formattedNote.users;

        return NextResponse.json({ note: formattedNote }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to create project note: ' + e.message }, { status: 500 });
    }
}
