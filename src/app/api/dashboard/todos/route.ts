import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'today';

    let targetDate = new Date();
    if (filter === 'yesterday') {
        targetDate.setDate(targetDate.getDate() - 1);
    } else if (filter === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    const targetDateStr = targetDate.toISOString().split('T')[0];

    const todos = await prisma.dashboard_todos.findMany({
        where: {
            user_id: user.user_id,
            target_date: new Date(targetDateStr)
        },
        orderBy: [
            { position: 'asc' },
            { id: 'asc' }
        ]
    });

    return NextResponse.json({ todos });
}

export async function POST(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const content = data.content || '';
        const filter = data.filter || 'today';

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        let targetDate = new Date();
        if (filter === 'yesterday') {
            targetDate.setDate(targetDate.getDate() - 1);
        } else if (filter === 'tomorrow') {
            targetDate.setDate(targetDate.getDate() + 1);
        }
        const targetDateStr = targetDate.toISOString().split('T')[0];
        const targetDateObj = new Date(targetDateStr);

        const lastTodo = await prisma.dashboard_todos.findFirst({
            where: {
                user_id: user.user_id,
                target_date: targetDateObj
            },
            orderBy: { position: 'desc' }
        });

        const nextPos = lastTodo && lastTodo.position !== null ? lastTodo.position + 1 : 1;

        const todo = await prisma.dashboard_todos.create({
            data: {
                user_id: user.user_id,
                content,
                target_date: targetDateObj,
                position: nextPos
            }
        });

        return NextResponse.json({
            message: 'Todo added',
            todo
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to add todo: ' + e.message }, { status: 500 });
    }
}
