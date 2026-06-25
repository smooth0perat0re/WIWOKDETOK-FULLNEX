import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function PUT(request: Request) {
    const token = extractTokenFromHeader(request.headers.get('Authorization'));
    const user = token ? verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const personalNotesIcon = data.personal_notes_icon !== undefined ? data.personal_notes_icon : null;

        const updates: any = {};
        if (personalNotesIcon !== null) {
            updates.personal_notes_icon = personalNotesIcon;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: 'No updates provided' }, { status: 200 });
        }

        const updatedUser = await prisma.users.update({
            where: { id: user.user_id },
            data: updates,
            select: {
                id: true,
                name: true,
                email: true,
                personal_notes_icon: true
            }
        });

        return NextResponse.json({
            message: 'Profile updated',
            user: updatedUser
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'Update failed: ' + e.message }, { status: 500 });
    }
}
