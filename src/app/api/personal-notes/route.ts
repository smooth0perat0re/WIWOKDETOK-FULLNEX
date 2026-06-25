import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const notes = await prisma.personal_notes.findMany({
            where: { user_id: user.user_id },
            orderBy: { updated_at: 'desc' }
        });

        return NextResponse.json({ notes });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to get personal notes: ' + e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const title = data.title || 'Untitled Note';
        const content = data.content || '';

        const note = await prisma.personal_notes.create({
            data: {
                user_id: user.user_id,
                title,
                content
            }
        });

        return NextResponse.json({
            message: 'Note created',
            note
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Creation failed: ' + e.message }, { status: 500 });
    }
}
