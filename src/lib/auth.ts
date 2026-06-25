import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'super_secret_wiwokdetok_jwt_key_2026_production_ready';

export interface JwtPayload {
    user_id: number;
    email: string;
    iat: number;
    exp: number;
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 86400; // 1 day
    // We pass iat and exp explicitly so jwt.sign doesn't auto-generate them differently
    return jwt.sign({ ...payload, iat, exp }, SECRET_KEY, { algorithm: 'HS256' });
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
        return decoded;
    } catch (e) {
        return null;
    }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
