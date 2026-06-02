import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

// 标记消息已读
async function markAsRead(request: AuthenticatedRequest) {
  const supabase = getSupabaseClient();
  try {
    const body = await request.json();
    const { otherUserId } = body;
    const userId = request.user.userId;

    if (!otherUserId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 将来自otherUserId的所有未读消息标记为已读
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', otherUserId)
      .eq('is_read', false);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('标记已读失败:', error);
    return NextResponse.json({ error: '标记已读失败' }, { status: 500 });
  }
}

export const POST = withAuth(markAsRead);
