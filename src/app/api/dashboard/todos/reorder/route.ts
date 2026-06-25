import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function PUT(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const items = data.items || [];

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
        }

        await prisma.$transaction(async (tx: any) => {
            for (const item of items) {
                if (item.id && item.position !== undefined) {
                    await tx.dashboard_todos.updateMany({
                        where: {
                            id: parseInt(item.id, 10),
                            user_id: user.user_id
                        },
                        data: {
                            position: parseInt(item.position, 10)
                        }
                    });
                }
            }
        });

        return NextResponse.json({ message: 'Todos reordered' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to reorder todos: ' + e.message }, { status: 500 });
    }
}
