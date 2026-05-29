import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userRole } = body;

    // 验证权限：只有管理员可以撤回公告
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: '权限不足，只有管理员可以撤回公告' },
        { status: 403 }
      );
    }

    const client = getSupabaseClient();

    // 检查公告是否存在
    const { data: existingAnnouncement, error: fetchError } = await client
      .from('announcements')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingAnnouncement) {
      return NextResponse.json(
        { error: '公告不存在' },
        { status: 404 }
      );
    }

    if (existingAnnouncement.status === 'withdrawn') {
      return NextResponse.json(
        { error: '该公告已被撤回' },
        { status: 400 }
      );
    }

    // 更新公告状态为已撤回
    const { data: announcement, error } = await client
      .from('announcements')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`撤回公告失败: ${error.message}`);
    }

    return NextResponse.json({
      announcement,
      message: '公告已撤回',
    });
  } catch (error) {
    console.error('撤回公告失败:', error);
    return NextResponse.json(
      { error: '撤回公告失败' },
      { status: 500 }
    );
  }
}
