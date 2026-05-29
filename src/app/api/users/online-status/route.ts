import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取用户在线状态
// 规则：5分钟内有活跃 = 在线，否则离线
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('userIds');

    if (!userIds) {
      return NextResponse.json(
        { error: '缺少用户ID列表' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const ids = userIds.split(',');

    // 获取用户的最后活跃时间
    const { data: users, error } = await supabase
      .from('users')
      .select('id, last_online_at')
      .in('id', ids);

    if (error) {
      console.error('获取用户状态失败:', error);
      return NextResponse.json(
        { error: '获取失败' },
        { status: 500 }
      );
    }

    // 计算在线状态
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const status: Record<string, boolean> = {};

    users?.forEach(user => {
      const lastOnline = user.last_online_at ? new Date(user.last_online_at) : null;
      status[user.id] = lastOnline ? lastOnline > fiveMinutesAgo : false;
    });

    return NextResponse.json({ status });
  } catch (error) {
    console.error('获取在线状态失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
