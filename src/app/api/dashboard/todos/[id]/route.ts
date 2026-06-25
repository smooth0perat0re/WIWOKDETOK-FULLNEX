import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const todoId = parseInt(id, 10);
    if (isNaN(todoId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        
        const updates: any = {};
        if (data.content !== undefined) updates.content = data.content;
        if (data.is_completed !== undefined) updates.is_completed = data.is_completed ? 'true' : 'false';

        if (Object.keys(updates).length > 0) {
            const existing = await prisma.dashboard_todos.findFirst({
                where: { id: todoId, user_id: user.user_id }
            });
            if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            await prisma.dashboard_todos.update({
                where: { id: todoId },
                data: updates
            });
        }

        return NextResponse.json({ message: 'Todo updated' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to update todo: ' + e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const todoId = parseInt(id, 10);
    if (isNaN(todoId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const existing = await prisma.dashboard_todos.findFirst({
            where: { id: todoId, user_id: user.user_id }
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.dashboard_todos.delete({
            where: { id: todoId }
        });

        return NextResponse.json({ message: 'Todo deleted' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to delete todo: ' + e.message }, { status: 500 });
    }
}
