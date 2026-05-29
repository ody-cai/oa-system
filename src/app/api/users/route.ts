import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 查询所有用户
    const { data: users, error } = await client
      .from('users')
      .select('id, email, name, role, is_active, storage_quota, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`查询用户失败: ${error.message}`);
    }

    return NextResponse.json({
      users: users || [],
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password, role = 'employee' } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: '邮箱、姓名和密码不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    // 检查邮箱是否已存在
    const { data: existingUsers } = await client
      .from('users')
      .select('id')
      .eq('email', email);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 管理员无上限配额（-1表示无限制），普通员工默认10GB
    const storageQuota = role === 'admin' ? -1 : 10737418240;

    // 创建新用户
    const { data: user, error } = await client
      .from('users')
      .insert({
        email,
        name,
        password_hash: password, // 生产环境应该加密
        role,
        is_active: true,
        storage_quota: storageQuota,
      })
      .select('id, email, name, role, is_active, storage_quota, created_at')
      .single();

    if (error) {
      throw new Error(`创建用户失败: ${error.message}`);
    }

    return NextResponse.json({
      user,
      message: '用户创建成功',
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    );
  }
}
