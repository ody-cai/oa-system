import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 验证Token并返回当前用户信息
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: '未提供认证令牌' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: '令牌无效或已过期' },
        { status: 401 }
      );
    }

    // 从数据库获取最新的用户信息
    const client = getSupabaseClient();
    const { data: user, error } = await client
      .from('users')
      .select('id, email, name, role, is_active, storage_quota, created_at')
      .eq('id', payload.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: '账户已被禁用' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user,
      valid: true,
    });
  } catch (error) {
    console.error('验证Token失败:', error);
    return NextResponse.json(
      { error: '验证失败' },
      { status: 500 }
    );
  }
}
