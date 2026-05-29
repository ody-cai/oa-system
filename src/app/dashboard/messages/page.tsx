'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatDialog } from '@/components/chat-dialog';
import { MessageCircle, Loader2 } from 'lucide-react';

interface Conversation {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  const fetchConversations = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/messages?userId=${currentUser.id}`);
      const data = await response.json();
      
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('获取会话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 172800000) return '昨天';
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  };

  const openChat = (conv: Conversation) => {
    setSelectedConversation(conv);
    setChatOpen(true);
  };

  if (!currentUser) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* 标题栏 */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#2D3748]">消息中心</h1>
        <p className="text-sm text-gray-600 mt-1">
          与同事和管理员的站内即时通讯
        </p>
      </div>

      {/* 会话列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <MessageCircle className="h-16 w-16 mb-4" />
          <p className="text-lg">暂无消息</p>
          <p className="text-sm mt-1">发送或接收消息后会在这里显示</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Card 
              key={conv.userId} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openChat(conv)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#ED8936] flex items-center justify-center">
                      <span className="text-white text-lg font-medium">
                        {conv.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[#2D3748]">{conv.userName}</h3>
                        <Badge variant={conv.userRole === 'admin' ? 'default' : 'secondary'}>
                          {conv.userRole === 'admin' ? '管理员' : '员工'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1">
                      {formatTime(conv.lastMessageTime)}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-orange-500 text-white">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 聊天对话框 */}
      {selectedConversation && currentUser && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={(open) => {
            setChatOpen(open);
            if (!open) {
              fetchConversations(); // 关闭时刷新会话列表
            }
          }}
          currentUserId={currentUser.id}
          otherUserId={selectedConversation.userId}
          otherUserName={selectedConversation.userName}
          title={`与 ${selectedConversation.userName} 的对话`}
        />
      )}
    </div>
  );
}
