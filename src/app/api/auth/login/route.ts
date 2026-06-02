import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { generateToken, verifyPassword } from '@/lib/auth';

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

    // 验证密码（支持bcrypt哈希和明文两种方式，便于迁移）
    let isPasswordValid = false;
    
    // 首先尝试bcrypt验证
    if (user.password_hash && user.password_hash.startsWith('$2')) {
      isPasswordValid = await verifyPassword(password, user.password_hash);
    } else {
      // 兼容旧数据：如果password_hash不是bcrypt格式，则直接比较
      // 注意：这只是过渡方案，生产环境应该强制使用bcrypt
      isPasswordValid = user.password_hash === password;
      
      // 如果验证通过，建议更新密码为bcrypt格式
      if (isPasswordValid) {
        console.warn(`用户 ${email} 使用明文密码，建议更新为bcrypt哈希`);
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    // 生成JWT Token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // 返回用户信息和Token
    const { password_hash, ...userInfo } = user;
    
    return NextResponse.json({
      user: userInfo,
      token,
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
