import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '@/lib/auth';

// 认证上下文，扩展了NextRequest
export interface AuthenticatedRequest extends NextRequest {
  user: JwtPayload;
}

// 认证中间件包装器 - 使用泛型支持动态路由
export function withAuth<TParams extends Record<string, string> = Record<string, string>>(
  handler: (request: AuthenticatedRequest, context: { params: Promise<TParams> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Promise<TParams> }) => {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '未提供认证令牌，请先登录' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: '令牌无效或已过期，请重新登录' },
        { status: 401 }
      );
    }

    // 将用户信息附加到request对象
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = payload;

    return handler(authenticatedRequest, context);
  };
}

// 可选认证中间件（允许匿名访问，但如果有token则验证）
export function withOptionalAuth<TParams extends Record<string, string> = Record<string, string>>(
  handler: (request: AuthenticatedRequest, context: { params: Promise<TParams> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Promise<TParams> }) => {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    const authenticatedRequest = request as AuthenticatedRequest;
    
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        authenticatedRequest.user = payload;
      }
    }

    return handler(authenticatedRequest, context);
  };
}

// 角色检查中间件
export function withRole<TParams extends Record<string, string> = Record<string, string>>(
  roles: string[]
) {
  return (
    handler: (request: AuthenticatedRequest, context: { params: Promise<TParams> }) => Promise<NextResponse>
  ) => {
    return withAuth<TParams>(async (request: AuthenticatedRequest, context: { params: Promise<TParams> }) => {
      if (!roles.includes(request.user.role)) {
        return NextResponse.json(
          { error: '权限不足，无法访问此资源' },
          { status: 403 }
        );
      }
      return handler(request, context);
    });
  };
}

// 仅限管理员
export const adminOnly = withRole(['admin']);
