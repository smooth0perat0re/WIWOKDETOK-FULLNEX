import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const workspaces = await prisma.workspaces.findMany({
            where: {
                workspace_members: {
                    some: {
                        user_id: user.user_id
                    }
                }
            },
            include: {
                workspace_members: {
                    where: {
                        user_id: user.user_id
                    },
                    select: {
                        role: true
                    }
                }
            }
        });

        // Flatten role like the PHP backend does: SELECT w.*, wm.role
        const formattedWorkspaces = workspaces.map((w: any) => {
            const { workspace_members, ...rest } = w;
            return {
                ...rest,
                role: workspace_members[0]?.role
            };
        });

        return NextResponse.json({ workspaces: formattedWorkspaces });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const { name = '', description = '', is_private = false, icon = '📁' } = data;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 8);

        const newWorkspace = await prisma.workspaces.create({
            data: {
                name,
                slug,
                description,
                is_private,
                icon,
                created_by: user.user_id,
                workspace_members: {
                    create: {
                        user_id: user.user_id,
                        role: 'admin'
                    }
                }
            }
        });

        return NextResponse.json({
            message: 'Workspace created',
            workspace: {
                id: newWorkspace.id,
                slug: newWorkspace.slug,
                name: newWorkspace.name,
                icon: newWorkspace.icon,
                is_private: newWorkspace.is_private
            }
        }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'Creation failed: ' + e.message }, { status: 500 });
    }
}
