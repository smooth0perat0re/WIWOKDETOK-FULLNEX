import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ task_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_id } = await context.params;
    const taskId = parseInt(task_id, 10);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const links = await prisma.task_links.findMany({
            where: { source_task_id: taskId },
            include: {
                tasks_task_links_target_task_idTotasks: {
                    select: {
                        title: true,
                        status: true,
                        ticket_reference: true
                    }
                }
            },
            orderBy: { created_at: 'asc' }
        });

        const formattedLinks = links.map((l: any) => ({
            id: l.id,
            source_task_id: l.source_task_id,
            target_task_id: l.target_task_id,
            link_type: l.link_type,
            created_at: l.created_at,
            created_by: l.created_by,
            target_title: l.tasks_task_links_target_task_idTotasks?.title,
            target_status: l.tasks_task_links_target_task_idTotasks?.status,
            target_ticket: l.tasks_task_links_target_task_idTotasks?.ticket_reference
        }));

        return NextResponse.json({ links: formattedLinks });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to get links: ' + e.message }, { status: 500 });
    }
}

export async function POST(request: Request, context: { params: Promise<{ task_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_id } = await context.params;
    const sourceTaskId = parseInt(task_id, 10);
    if (isNaN(sourceTaskId)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    try {
        const data = await request.json();
        const targetTaskId = parseInt(data.target_task_id, 10);
        const linkType = data.link_type || 'related';

        if (isNaN(targetTaskId)) {
            return NextResponse.json({ error: 'Target task ID is required' }, { status: 400 });
        }

        await prisma.task_links.create({
            data: {
                source_task_id: sourceTaskId,
                target_task_id: targetTaskId,
                link_type: linkType,
                created_by: user.user_id
            }
        });

        return NextResponse.json({ message: 'Task linked successfully' }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Task linking failed: ' + e.message }, { status: 500 });
    }
}
