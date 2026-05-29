'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Loader2 } from 'lucide-react';

interface ContactAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactAdminDialog({
  open,
  onOpenChange
}: ContactAdminDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // 发送消息给管理员
  const sendToAdmin = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      return;
    }

    setSending(true);
    try {
      // 获取管理员ID（假设管理员邮箱是admin@oa.com）
      const adminEmail = 'admin@oa.com';
      
      // 先通过邮箱查找管理员
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'guest', // 游客发送
          receiverId: 'admin', // 管理员
          content: `[来自访客]\n姓名: ${name}\n邮箱: ${email}\n\n消息内容:\n${message}`
        })
      });

      // 由于游客没有账号，我们需要用特殊方式处理
      // 这里我们创建一个临时消息存储在系统中
      const guestMessage = {
        guest_name: name,
        guest_email: email,
        message: message,
        created_at: new Date().toISOString()
      };

      // 存储到localStorage，等待管理员查看
      const guestMessages = JSON.parse(localStorage.getItem('guest_messages') || '[]');
      guestMessages.push(guestMessage);
      localStorage.setItem('guest_messages', JSON.stringify(guestMessages));

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName('');
        setEmail('');
        setMessage('');
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('发送失败:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-orange-500" />
            联系管理员
          </DialogTitle>
          <DialogDescription>
            填写以下信息，管理员会尽快回复您
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">消息已发送！</p>
            <p className="text-sm text-gray-500 mt-1">管理员会尽快处理您的请求</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">您的姓名</label>
              <Input
                placeholder="请输入姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">联系邮箱</label>
              <Input
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">消息内容</label>
              <Textarea
                placeholder="请描述您的问题或需求..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 resize-none"
              />
            </div>
            <Button
              onClick={sendToAdmin}
              disabled={!name.trim() || !email.trim() || !message.trim() || sending}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  发送中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  发送消息
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
