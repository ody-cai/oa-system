import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { is_active, storage_quota } = body;

    const client = getSupabaseClient();
    
    // 构建更新对象
    const updateData: Record<string, unknown> = {};
    if (typeof is_active === 'boolean') {
      updateData.is_active = is_active;
    }
    if (typeof storage_quota === 'number') {
      updateData.storage_quota = storage_quota;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '没有要更新的内容' },
        { status: 400 }
      );
    }

    const { data: user, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, role, is_active, storage_quota')
      .single();

    if (error) {
      throw new Error(`更新用户失败: ${error.message}`);
    }

    return NextResponse.json({
      user,
      message: '用户信息已更新',
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json(
      { error: '更新用户失败' },
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
