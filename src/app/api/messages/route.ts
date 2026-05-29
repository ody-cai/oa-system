import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取会话列表或对话消息
export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const otherUserId = searchParams.get('otherUserId');

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }

    // 如果指定了otherUserId，获取两人之间的对话消息
    if (otherUserId) {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          is_read,
          created_at
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 筛选出两人之间的消息
      const conversationMessages = messages?.filter(
        (msg: { sender_id: string; receiver_id: string }) =>
          (msg.sender_id === userId && msg.receiver_id === otherUserId) ||
          (msg.sender_id === otherUserId && msg.receiver_id === userId)
      ) || [];

      return NextResponse.json({ messages: conversationMessages });
    }

    // 否则获取会话列表
    // 获取所有涉及该用户的消息
    const { data: allMessages, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        is_read,
        created_at
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 获取所有相关的用户ID
    const userIds = new Set<string>();
    allMessages?.forEach((msg: { sender_id: string; receiver_id: string }) => {
      if (msg.sender_id !== userId) userIds.add(msg.sender_id);
      if (msg.receiver_id !== userId) userIds.add(msg.receiver_id);
    });

    // 获取用户信息
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, role')
      .in('id', Array.from(userIds));

    // 构建会话列表
    const conversations = new Map();
    allMessages?.forEach((msg: { 
      id: string; 
      sender_id: string; 
      receiver_id: string; 
      content: string; 
      is_read: boolean; 
      created_at: string;
    }) => {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversations.has(otherId)) {
        const userInfo = users?.find((u: { id: string }) => u.id === otherId);
        conversations.set(otherId, {
          userId: otherId,
          userName: userInfo?.name || '未知用户',
          userEmail: userInfo?.email || '',
          userRole: userInfo?.role || 'employee',
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0
        });
      }
    });

    // 计算未读消息数
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', userId)
      .eq('is_read', false);

    unreadMessages?.forEach((msg: { sender_id: string }) => {
      const conv = conversations.get(msg.sender_id);
      if (conv) {
        conv.unreadCount++;
      }
    });

    return NextResponse.json({ 
      conversations: Array.from(conversations.values())
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
    });
  } catch (error) {
    console.error('获取消息失败:', error);
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 });
  }
}

// 发送消息
export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  try {
    const body = await request.json();
    const { senderId, receiverId, content } = body;

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: content,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      message: message,
      success: true 
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json({ error: '发送消息失败' }, { status: 500 });
  }
}
