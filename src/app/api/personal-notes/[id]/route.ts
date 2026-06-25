import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        const title = data.title !== undefined ? data.title : null;
        const content = data.content !== undefined ? data.content : null;

        const check = await prisma.personal_notes.findFirst({
            where: { id: noteId, user_id: user.user_id }
        });
        if (!check) return NextResponse.json({ error: 'Forbidden or Not found' }, { status: 403 });

        const updates: any = {};
        if (title !== null) updates.title = title;
        if (content !== null) updates.content = content;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: 'No updates provided' }, { status: 200 });
        }

        const note = await prisma.personal_notes.update({
            where: { id: noteId },
            data: updates
        });

        return NextResponse.json({ message: 'Note updated', note });
    } catch (e: any) {
        return NextResponse.json({ error: 'Update failed: ' + e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const check = await prisma.personal_notes.findFirst({
            where: { id: noteId, user_id: user.user_id }
        });
        if (!check) return NextResponse.json({ error: 'Not found or Forbidden' }, { status: 404 });

        await prisma.personal_notes.delete({
            where: { id: noteId }
        });

        return NextResponse.json({ message: 'Note deleted' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Deletion failed: ' + e.message }, { status: 500 });
    }
}
