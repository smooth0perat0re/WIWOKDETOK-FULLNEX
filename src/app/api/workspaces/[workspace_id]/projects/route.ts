import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { resolveWorkspaceId, checkWorkspaceAccess } from '@/lib/workspace-helper';

export async function GET(request: Request, context: { params: Promise<{ workspace_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id } = await context.params;
    const workspaceId = await resolveWorkspaceId(workspace_id);
    if (!workspaceId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const hasAccess = await checkWorkspaceAccess(workspaceId, user.user_id);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const projects = await prisma.projects.findMany({
        where: { workspace_id: workspaceId },
        orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ projects });
}

export async function POST(request: Request, context: { params: Promise<{ workspace_id: string }> }) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id } = await context.params;
    const workspaceId = await resolveWorkspaceId(workspace_id);
    if (!workspaceId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const hasAccess = await checkWorkspaceAccess(workspaceId, user.user_id);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const data = await request.json();
        const { name = '', description = '' } = data;

        const project = await prisma.projects.create({
            data: {
                workspace_id: workspaceId,
                name,
                description,
                created_by: user.user_id,
                project_members: {
                    create: {
                        user_id: user.user_id,
                        role: 'admin'
                    }
                }
            }
        });

        return NextResponse.json({
            message: 'Project created',
            project: { id: project.id, name: project.name }
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Creation failed: ' + e.message }, { status: 500 });
    }
}
