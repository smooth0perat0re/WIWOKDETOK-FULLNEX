import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const stickyId = parseInt(id, 10);
    if (isNaN(stickyId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        const content = data.content || '';
        const color = data.color || 'yellow';

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const existing = await prisma.sticky_notes.findFirst({
            where: { id: stickyId, user_id: user.user_id }
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.sticky_notes.update({
            where: { id: stickyId },
            data: { content, color }
        });

        return NextResponse.json({ message: 'Sticky note updated' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to update sticky note: ' + e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const stickyId = parseInt(id, 10);
    if (isNaN(stickyId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const existing = await prisma.sticky_notes.findFirst({
            where: { id: stickyId, user_id: user.user_id }
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.sticky_notes.delete({
            where: { id: stickyId }
        });

        return NextResponse.json({ message: 'Sticky note deleted' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to delete sticky note: ' + e.message }, { status: 500 });
    }
}
