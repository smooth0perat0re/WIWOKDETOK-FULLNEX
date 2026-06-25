import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function DELETE(request: Request, context: { params: Promise<{ link_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { link_id } = await context.params;
    const linkId = parseInt(link_id, 10);
    if (isNaN(linkId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        await prisma.task_links.delete({
            where: { id: linkId }
        });

        return NextResponse.json({ message: 'Link removed' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Delete link failed: ' + e.message }, { status: 500 });
    }
}
