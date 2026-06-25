import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const quicklinkId = parseInt(id, 10);
    if (isNaN(quicklinkId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        const { title, url } = data;

        if (!title || !url) {
            return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
        }

        const existing = await prisma.quicklinks.findFirst({
            where: { id: quicklinkId, user_id: user.user_id }
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.quicklinks.update({
            where: { id: quicklinkId },
            data: { title, url }
        });

        return NextResponse.json({ message: 'Quicklink updated' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to update quicklink: ' + e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const quicklinkId = parseInt(id, 10);
    if (isNaN(quicklinkId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const existing = await prisma.quicklinks.findFirst({
            where: { id: quicklinkId, user_id: user.user_id }
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.quicklinks.delete({
            where: { id: quicklinkId }
        });

        return NextResponse.json({ message: 'Quicklink deleted' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to delete quicklink: ' + e.message }, { status: 500 });
    }
}
