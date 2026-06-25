import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateToken } from '@/lib/auth';
import { HmacClient } from '@/lib/hmac';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const username = body.email || body.username || '';
        const password = body.password || '';

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
        }

        const apiUrl = process.env.EXTERNAL_AUTH_API_URL || 'http://localhost:8000';
        const apiKey = process.env.EXTERNAL_AUTH_API_KEY || '';
        const apiSecret = process.env.EXTERNAL_AUTH_API_SECRET || '';

        // 1. Authenticate via External API
        const externalResp = await HmacClient.sendRequest('POST', apiUrl + '/api/login-staff', {
            username,
            password
        }, apiKey, apiSecret);

        if (externalResp.status === 200 && externalResp.body?.data) {
            const userData = externalResp.body.data;
            const nama = userData.NAMA || username;
            const email = userData.EMAIL || username;

            // 2. Check or Create User in local DB
            let localUser = await prisma.users.findUnique({
                where: { email }
            });

            if (!localUser) {
                // Auto-register
                const dummyPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
                
                localUser = await prisma.users.create({
                    data: {
                        name: nama,
                        email: email,
                        password_hash: dummyPassword,
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
                        created_by: localUser.id,
                        workspace_members: {
                            create: {
                                user_id: localUser.id,
                                role: 'admin'
                            }
                        }
                    }
                });
            } else {
                // Optionally update name if it changed from external provider
                if (localUser.name !== nama) {
                    localUser = await prisma.users.update({
                        where: { id: localUser.id },
                        data: { name: nama }
                    });
                }
            }

            // 3. Issue Local JWT
            const token = generateToken({
                user_id: localUser.id,
                email: localUser.email,
            });

            return NextResponse.json({
                message: 'Login successful',
                token: token,
                user: {
                    id: localUser.id,
                    name: localUser.name,
                    email: localUser.email,
                    personal_notes_icon: localUser.personal_notes_icon || '📝'
                }
            }, { status: 200 });
        }

        // Handle error from external API
        let errorMsg = 'Invalid credentials or API error';
        if (externalResp.body && externalResp.body.message) {
            errorMsg = externalResp.body.message;
        }

        return NextResponse.json({ error: errorMsg }, { status: 401 });

    } catch (error: any) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
