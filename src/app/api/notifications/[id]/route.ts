import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        await prisma.notifications.updateMany({
            where: {
                id: notificationId,
                user_id: user.user_id
            },
            data: {
                deleted_at: new Date()
            }
        });

        return NextResponse.json({ message: 'Notification soft deleted' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to delete notification: ' + e.message }, { status: 500 });
    }
}
