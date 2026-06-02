import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

// 更新用户最后活跃时间
async function heartbeat(request: AuthenticatedRequest) {
  try {
    const userId = request.user.userId;

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('users')
      .update({ last_online_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('更新活跃时间失败:', error);
      return NextResponse.json(
        { error: '更新失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('心跳请求失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(heartbeat);
