import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const photos = await prisma.dashboard_photos.findMany({
        where: { user_id: user.user_id },
        orderBy: { created_at: 'asc' },
        take: 4
    });

    return NextResponse.json({ photos });
}

export async function POST(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const photoUrl = data.photo_url || '';

        if (!photoUrl) {
            return NextResponse.json({ error: 'Photo URL is required' }, { status: 400 });
        }

        const photo = await prisma.dashboard_photos.create({
            data: {
                user_id: user.user_id,
                photo_url: photoUrl
            }
        });

        return NextResponse.json({
            message: 'Photo added',
            photo
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to add photo: ' + e.message }, { status: 500 });
    }
}
