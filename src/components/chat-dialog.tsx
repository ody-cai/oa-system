'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Check, CheckCheck, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  title?: string;
}

export function ChatDialog({
  open,
  onOpenChange,
  currentUserId,
  otherUserId,
  otherUserName,
  title = '聊天'
}: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 获取消息
  const fetchMessages = async () => {
    if (!open) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/messages?userId=${currentUserId}&otherUserId=${otherUserId}`
      );
      const data = await response.json();
      
      if (data.messages) {
        setMessages(data.messages);
        
        // 标记消息已读
        await fetch('/api/messages/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, otherUserId })
        });
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: otherUserId,
          content: newMessage.trim()
        })
      });

      const data = await response.json();
      
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setSending(false);
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 打开时加载消息
  useEffect(() => {
    if (open) {
      fetchMessages();
    }
  }, [open, currentUserId, otherUserId]);

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 今天
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    // 昨天
    if (diff < 172800000 && date.getDate() !== now.getDate()) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    // 更早
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        sm:max-w-[500px] 
        w-[95vw] max-w-[95vw]
        md:w-auto md:max-w-[500px]
        h-[85vh] sm:h-[600px]
        max-h-[85vh] sm:max-h-[600px]
        flex flex-col
        p-0 gap-0
      ">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-orange-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        {/* 消息列表 */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-3 px-4 py-3 bg-gray-50"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="h-12 w-12 mb-2" />
              <p>暂无消息</p>
              <p className="text-sm">发送第一条消息开始对话</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] sm:max-w-[70%] px-3 sm:px-4 py-2 rounded-lg ${
                    msg.sender_id === currentUserId
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border'
                  }`}
                >
                  <p className="break-words text-sm sm:text-base">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    msg.sender_id === currentUserId ? 'text-orange-100' : 'text-gray-400'
                  }`}>
                    <span>{formatTime(msg.created_at)}</span>
                    {msg.sender_id === currentUserId && (
                      <span className="flex items-center">
                        {msg.is_read ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 输入区域 */}
        <div className="flex gap-2 p-4 border-t bg-white">
          <Input
            placeholder="输入消息..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={sending}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            className="bg-orange-500 hover:bg-orange-600 px-3 sm:px-4"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
