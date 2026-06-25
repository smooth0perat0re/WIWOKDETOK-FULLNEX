import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const quicklinks = await prisma.quicklinks.findMany({
        where: { user_id: user.user_id },
        orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ quicklinks });
}

export async function POST(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const { title, url } = data;

        if (!title || !url) {
            return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
        }

        const quicklink = await prisma.quicklinks.create({
            data: {
                user_id: user.user_id,
                title,
                url
            }
        });

        return NextResponse.json({
            message: 'Quicklink added',
            quicklink
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to add quicklink: ' + e.message }, { status: 500 });
    }
}
