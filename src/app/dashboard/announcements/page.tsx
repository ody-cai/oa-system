'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Bell, Plus, Pin, Calendar } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('获取公告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTitle.trim() || !newContent.trim()) {
      alert('请填写标题和内容');
      return;
    }

    // 从 localStorage 获取用户信息
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    setSubmitting(true);
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          isPinned,
          authorId: user?.id || 'system',
        }),
      });

      if (!response.ok) {
        throw new Error('发布公告失败');
      }

      await fetchAnnouncements();
      setDialogOpen(false);
      setNewTitle('');
      setNewContent('');
      setIsPinned(false);
    } catch (error) {
      console.error('发布公告失败:', error);
      alert('发布公告失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D3748]">公告中心</h1>
          <p className="text-sm text-gray-600 mt-1">
            查看和发布公司公告
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#ED8936] hover:bg-[#DD7730]">
              <Plus className="h-4 w-4 mr-2" />
              发布公告
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>发布新公告</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700">标题</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="公告标题"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">内容</label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="公告内容..."
                  rows={6}
                  className="mt-1"
                  required
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="pinned" className="text-sm text-gray-700">
                  置顶公告
                </label>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#ED8936] hover:bg-[#DD7730]"
                >
                  {submitting ? '发布中...' : '发布'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 公告列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ED8936]"></div>
        </div>
      ) : announcements.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无公告</p>
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="mt-4 border-[#ED8936] text-[#ED8936]"
            >
              发布第一条公告
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`border-0 shadow-sm hover:shadow-md transition-shadow ${
                announcement.is_pinned ? 'border-l-4 border-l-[#ED8936]' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {announcement.is_pinned && (
                    <Pin className="h-5 w-5 text-[#ED8936] flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-[#2D3748]">
                        {announcement.title}
                      </h3>
                      {announcement.is_pinned && (
                        <span className="px-2 py-1 text-xs font-medium bg-[#ED8936] text-white rounded">
                          置顶
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(announcement.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
