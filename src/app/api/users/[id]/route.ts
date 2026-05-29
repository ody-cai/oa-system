import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: '无效的状态值' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    const { data: user, error } = await client
      .from('users')
      .update({ is_active })
      .eq('id', userId)
      .select('id, email, name, role, is_active')
      .single();

    if (error) {
      throw new Error(`更新用户状态失败: ${error.message}`);
    }

    return NextResponse.json({
      user,
      message: '用户状态已更新',
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    return NextResponse.json(
      { error: '更新用户状态失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const client = getSupabaseClient();
    
    const { error } = await client
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(`删除用户失败: ${error.message}`);
    }

    return NextResponse.json({
      message: '用户已删除',
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    );
  }
}
