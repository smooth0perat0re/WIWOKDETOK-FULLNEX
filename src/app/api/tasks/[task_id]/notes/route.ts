import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ task_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_id } = await context.params;
    const taskId = parseInt(task_id, 10);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const notes = await prisma.task_comments.findMany({
            where: { task_id: taskId },
            include: {
                users: {
                    select: { name: true }
                }
            },
            orderBy: { created_at: 'asc' }
        });

        const formattedNotes = notes.map((n: any) => {
            const { users, ...rest } = n;
            return {
                ...rest,
                user_name: users?.name
            };
        });

        return NextResponse.json({ notes: formattedNotes });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to get task notes: ' + e.message }, { status: 500 });
    }
}

export async function POST(request: Request, context: { params: Promise<{ task_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_id } = await context.params;
    const taskId = parseInt(task_id, 10);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        const content = data.content || '';
        const attachment_url = data.attachment_url || null;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const note = await prisma.task_comments.create({
            data: {
                task_id: taskId,
                user_id: user.user_id,
                content,
                attachment_url
            },
            include: {
                users: {
                    select: { name: true }
                }
            }
        });

        const formattedNote = {
            ...note,
            user_name: note.users?.name
        };
        // @ts-ignore
        delete formattedNote.users;

        return NextResponse.json({ note: formattedNote }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to create task note: ' + e.message }, { status: 500 });
    }
}
