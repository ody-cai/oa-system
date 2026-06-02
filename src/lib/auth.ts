import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'oa-system-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const JWT_ISSUER = 'oa-system';
const JWT_AUDIENCE = 'oa-system-users';

// 从密钥字符串生成密钥
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

// 用户信息接口
export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

// 生成JWT Token
export async function generateToken(payload: JwtPayload): Promise<string> {
  const secretKey = getSecretKey();
  
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secretKey);
  
  return token;
}

// 验证JWT Token
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secretKey = getSecretKey();
    
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch (error) {
    console.error('JWT验证失败:', error);
    return null;
  }
}

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// 验证密码
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 从请求头提取Token
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
