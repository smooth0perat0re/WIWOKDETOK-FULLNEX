import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const recents = await prisma.recent_activities.findMany({
            where: { user_id: user.user_id },
            orderBy: { created_at: 'desc' },
            take: 10
        });

        return NextResponse.json({ recents });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to get recents: ' + e.message }, { status: 500 });
    }
}
