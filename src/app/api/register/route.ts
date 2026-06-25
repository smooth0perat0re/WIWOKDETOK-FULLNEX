import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await prisma.users.create({
            data: {
                name,
                email,
                password_hash,
            }
        });

        // Create default Personal Workspace
        const wsSlug = 'personal-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
        await prisma.workspaces.create({
            data: {
                name: 'My Personal Space',
                slug: wsSlug,
                description: 'Your private workspace',
                is_private: true,
                icon: '🚀',
                created_by: newUser.id,
                workspace_members: {
                    create: {
                        user_id: newUser.id,
                        role: 'admin'
                    }
                }
            }
        });

        return NextResponse.json({
            message: 'User registered successfully',
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        }, { status: 201 });

    } catch (error: any) {
        console.error("Register Error:", error);
        // Follow PHP logic of returning 500
        return NextResponse.json({ error: 'Registration failed. Email might already exist.' }, { status: 500 });
    }
}
