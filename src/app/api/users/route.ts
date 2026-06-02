import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { adminOnly, AuthenticatedRequest } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';

async function getUsers(request: AuthenticatedRequest) {
  try {
    const client = getSupabaseClient();
    
    // 查询所有用户
    const { data: users, error } = await client
      .from('users')
      .select('id, email, name, role, is_active, storage_quota, created_at, last_online_at')
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

async function createUser(request: AuthenticatedRequest) {
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

    // 使用bcrypt哈希密码
    const hashedPassword = await hashPassword(password);

    // 创建新用户
    const { data: user, error } = await client
      .from('users')
      .insert({
        email,
        name,
        password_hash: hashedPassword,
        role,
        is_active: true,
        storage_quota: storageQuota,
      })
      .select('id, email, name, role, is_active, storage_quota, created_at, last_online_at')
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

// 仅管理员可访问
export const GET = adminOnly(getUsers);
export const POST = adminOnly(createUser);
