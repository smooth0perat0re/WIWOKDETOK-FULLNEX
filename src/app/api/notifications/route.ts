import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifications = await prisma.notifications.findMany({
        where: {
            user_id: user.user_id,
            deleted_at: null
        },
        orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ notifications });
}
