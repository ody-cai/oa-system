import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const userRole = searchParams.get('userRole') || 'employee';

    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    // 普通用户只能看到 active 状态的公告
    if (userRole !== 'admin') {
      query = query.eq('status', 'active');
    }
    // 管理员可以看到所有公告（包括已撤回的）

    const { data: announcements, error } = await query;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, isPinned = false, authorId = 'system' } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    const { data: announcement, error } = await client
      .from('announcements')
      .insert({
        title,
        content,
        author_id: authorId,
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
