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
import { Bell, Plus, Pin, Calendar, RotateCcw } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
  status: string;
  withdrawn_at: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'withdrawn'>('all');

  useEffect(() => {
    // 获取用户信息
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchAnnouncements();
  }, []);

  // 当筛选条件改变时重新获取公告
  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [statusFilter, user]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      // 管理员传递 userRole 参数，可以看到所有公告
      const params = new URLSearchParams();
      if (user?.role === 'admin') {
        params.append('userRole', 'admin');
      }
      
      const response = await fetch(`/api/announcements?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        let fetchedAnnouncements = data.announcements || [];
        
        // 客户端筛选（如果管理员选择了特定状态）
        if (user?.role === 'admin' && statusFilter !== 'all') {
          fetchedAnnouncements = fetchedAnnouncements.filter(
            (a: Announcement) => a.status === statusFilter
          );
        }
        
        setAnnouncements(fetchedAnnouncements);
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

  const handleWithdraw = async (announcementId: string) => {
    if (!confirm('确定要撤回这条公告吗？撤回后普通用户将无法看到。')) {
      return;
    }

    try {
      const response = await fetch(`/api/announcements/${announcementId}/withdraw`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole: user?.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '撤回失败');
      }

      await fetchAnnouncements();
      alert('公告已撤回');
    } catch (error) {
      console.error('撤回公告失败:', error);
      alert(error instanceof Error ? error.message : '撤回失败，请重试');
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
    <div className="p-4 sm:p-6 lg:p-8">
      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2D3748]">公告中心</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            查看和发布公司公告
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* 状态筛选（仅管理员可见） */}
          {user?.role === 'admin' && (
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-[#ED8936] hover:bg-[#DD7730]' : ''}
              >
                全部
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className={statusFilter === 'active' ? 'bg-[#ED8936] hover:bg-[#DD7730]' : ''}
              >
                正常
              </Button>
              <Button
                variant={statusFilter === 'withdrawn' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('withdrawn')}
                className={statusFilter === 'withdrawn' ? 'bg-[#ED8936] hover:bg-[#DD7730]' : ''}
              >
                已撤回
              </Button>
            </div>
          )}
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#ED8936] hover:bg-[#DD7730] w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                发布公告
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">发布新公告</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700">标题</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="公告标题"
                  className="mt-1 text-sm sm:text-base"
                  required
                />
              </div>
              
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700">内容</label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="公告内容..."
                  rows={6}
                  className="mt-1 text-sm sm:text-base"
                  required
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-gray-300 w-4 h-4"
                />
                <label htmlFor="pinned" className="text-xs sm:text-sm text-gray-700">
                  置顶公告
                </label>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="text-sm sm:text-base"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#ED8936] hover:bg-[#DD7730] text-sm sm:text-base"
                >
                  {submitting ? '发布中...' : '发布'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* 公告列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ED8936]"></div>
        </div>
      ) : announcements.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 sm:p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-500">暂无公告</p>
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="mt-4 border-[#ED8936] text-[#ED8936] text-sm sm:text-base"
            >
              发布第一条公告
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`border-0 shadow-sm hover:shadow-md transition-shadow ${
                announcement.is_pinned ? 'border-l-4 border-l-[#ED8936]' : ''
              } ${announcement.status === 'withdrawn' ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  {announcement.is_pinned && (
                    <Pin className="h-4 w-4 sm:h-5 sm:w-5 text-[#ED8936] flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-semibold text-[#2D3748]">
                        {announcement.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {announcement.status === 'withdrawn' && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-400 text-white rounded self-start">
                            已撤回
                          </span>
                        )}
                        {announcement.is_pinned && (
                          <span className="px-2 py-1 text-xs font-medium bg-[#ED8936] text-white rounded self-start">
                            置顶
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm sm:text-base text-gray-600 mt-2 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 sm:mt-4">
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formatDate(announcement.created_at)}
                        </div>
                        {announcement.status === 'withdrawn' && announcement.withdrawn_at && (
                          <div className="text-gray-400">
                            撤回于 {formatDate(announcement.withdrawn_at)}
                          </div>
                        )}
                      </div>
                      
                      {/* 撤回按钮（仅管理员可看到，且只能撤回正常状态的公告） */}
                      {user?.role === 'admin' && announcement.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWithdraw(announcement.id)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          撤回
                        </Button>
                      )}
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
