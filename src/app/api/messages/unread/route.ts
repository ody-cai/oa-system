import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

// 获取未读消息数量
async function getUnreadCount(request: AuthenticatedRequest) {
  const supabase = getSupabaseClient();
  try {
    const userId = request.user.userId;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return NextResponse.json({ 
      unreadCount: count || 0
    });
  } catch (error) {
    console.error('获取未读消息数失败:', error);
    return NextResponse.json({ error: '获取未读消息数失败' }, { status: 500 });
  }
}

export const GET = withAuth(getUnreadCount);
