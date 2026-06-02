import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function getAnnouncements(request: AuthenticatedRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const client = getSupabaseClient();
    
    // 查询公告，置顶的在前，然后按创建时间倒序
    const { data: announcements, error } = await client
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`查询公告失败: ${error.message}`);
    }

    return NextResponse.json({
      announcements: announcements || [],
    });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    return NextResponse.json(
      { error: '获取公告列表失败' },
      { status: 500 }
    );
  }
}

async function createAnnouncement(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { title, content, isPinned = false } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    // 使用当前登录用户作为作者
    const { data: announcement, error } = await client
      .from('announcements')
      .insert({
        title,
        content,
        author_id: request.user.userId,
        is_pinned: isPinned,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`发布公告失败: ${error.message}`);
    }

    return NextResponse.json({
      announcement,
      message: '公告发布成功',
    });
  } catch (error) {
    console.error('发布公告失败:', error);
    return NextResponse.json(
      { error: '发布公告失败' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAnnouncements);
export const POST = withAuth(createAnnouncement);
