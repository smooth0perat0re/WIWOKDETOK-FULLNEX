import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const photoId = parseInt(id, 10);
    if (isNaN(photoId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const existing = await prisma.dashboard_photos.findFirst({
            where: { id: photoId, user_id: user.user_id }
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.dashboard_photos.delete({
            where: { id: photoId }
        });

        return NextResponse.json({ message: 'Photo deleted' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to delete photo: ' + e.message }, { status: 500 });
    }
}
