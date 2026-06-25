import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const notification = await prisma.notifications.findFirst({
            where: {
                id: notificationId,
                user_id: user.user_id
            }
        });

        if (!notification) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await prisma.notifications.update({
            where: { id: notification.id },
            data: {
                is_flagged: !notification.is_flagged
            }
        });

        return NextResponse.json({ message: 'Notification flag toggled' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to toggle flag: ' + e.message }, { status: 500 });
    }
}
