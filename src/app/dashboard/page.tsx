'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
  status: string;
}

interface FileStat {
  total_files: number;
  total_size: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function DashboardPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [fileStat, setFileStat] = useState<FileStat>({ total_files: 0, total_size: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 获取用户信息
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    Promise.all([
      fetchDashboardData(),
      fetchAnnouncements(),
    ]).finally(() => setLoading(false));
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/files/stats');
      if (response.ok) {
        const data = await response.json();
        setFileStat(data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      // 根据用户角色获取公告
      const params = new URLSearchParams({ limit: '5' });
      if (user?.role) {
        params.append('userRole', user.role);
      }
      
      const response = await fetch(`/api/announcements?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('获取公告失败:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ED8936]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* 欢迎区域 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#2D3748]">
          欢迎回来！
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          {new Date().toLocaleDateString('zh-CN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
              文件总数
            </CardTitle>
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#ED8936]" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-[#2D3748]">{fileStat.total_files}</div>
            <p className="text-xs text-gray-500 mt-1">已上传文件</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
              存储空间
            </CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#48BB78]" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-[#2D3748]">
              {formatFileSize(fileStat.total_size)}
            </div>
            <p className="text-xs text-gray-500 mt-1">已使用空间</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
              今日公告
            </CardTitle>
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-[#ECC94B]" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-[#2D3748]">{announcements.length}</div>
            <p className="text-xs text-gray-500 mt-1">最新公告</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
              待办事项
            </CardTitle>
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#ED8936]" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-[#2D3748]">0</div>
            <p className="text-xs text-gray-500 mt-1">待处理任务</p>
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-[#2D3748] mb-3 sm:mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <Button className="bg-[#ED8936] hover:bg-[#DD7730] text-sm sm:text-base">
            <FileText className="h-4 w-4 mr-2" />
            上传文件
          </Button>
          <Button variant="outline" className="border-gray-300 text-sm sm:text-base">
            <MessageSquare className="h-4 w-4 mr-2" />
            发布公告
          </Button>
          <Button variant="outline" className="border-gray-300 text-sm sm:text-base">
            <Users className="h-4 w-4 mr-2" />
            团队协作
          </Button>
        </div>
      </div>

      {/* 最新公告 */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-[#2D3748]">最新公告</h2>
          <Button variant="ghost" size="sm" className="text-[#ED8936] text-xs sm:text-sm">
            查看全部
          </Button>
        </div>
        <div className="space-y-3">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-[#2D3748] text-sm sm:text-base truncate">
                          {announcement.title}
                        </h3>
                        {announcement.is_pinned && (
                          <Bell className="h-4 w-4 text-[#ED8936] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(announcement.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center text-gray-500">
                暂无公告
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
