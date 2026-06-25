import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stickies = await prisma.sticky_notes.findMany({
        where: { user_id: user.user_id },
        orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ stickies });
}

export async function POST(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const content = data.content || '';
        const color = data.color || 'yellow';

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const sticky = await prisma.sticky_notes.create({
            data: {
                user_id: user.user_id,
                content,
                color
            }
        });

        return NextResponse.json({
            message: 'Sticky note added',
            sticky
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to add sticky note: ' + e.message }, { status: 500 });
    }
}
