import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    // 查询用户
    const { data: users, error } = await client
      .from('users')
      .select('id, email, name, role, password_hash')
      .eq('email', email)
      .eq('is_active', true);

    if (error) {
      throw new Error(`查询用户失败: ${error.message}`);
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: '用户不存在或已被禁用' },
        { status: 401 }
      );
    }

    const user = users[0];

    // 使用 bcrypt 验证密码
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    // 返回用户信息（不包含密码）
    const { password_hash, ...userInfo } = user;
    
    return NextResponse.json({
      user: userInfo,
      message: '登录成功',
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
