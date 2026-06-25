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
        const data = await request.json();
        const remindAt = data.remind_at || null;

        if (!remindAt) {
            return NextResponse.json({ error: 'remind_at is required' }, { status: 400 });
        }

        await prisma.notifications.updateMany({
            where: {
                id: notificationId,
                user_id: user.user_id
            },
            data: {
                remind_at: new Date(remindAt)
            }
        });

        return NextResponse.json({ message: 'Reminder set successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to set reminder: ' + e.message }, { status: 500 });
    }
}
