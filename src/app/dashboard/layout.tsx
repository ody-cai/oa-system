'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  FileText, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  User,
  Users,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 检测屏幕方向和大小
  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsLandscape(width > height);
      
      // 平板横屏时默认展开侧边栏，竖屏时默认折叠
      if (width >= 768 && width < 1024) {
        setSidebarCollapsed(width < height);
      }
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  // 获取未读消息数
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // 每30秒刷新一次未读消息数
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/messages/unread?userId=${user.id}`);
      const data = await response.json();
      
      if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('获取未读消息数失败:', error);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  interface MenuItem {
    href: string;
    label: string;
    icon: React.ElementType;
    adminOnly: boolean;
    badge?: number;
  }

  const menuItems: MenuItem[] = [
    { href: '/dashboard', label: '仪表盘', icon: Home, adminOnly: false },
    { href: '/dashboard/files', label: '文件管理', icon: FileText, adminOnly: false },
    { href: '/dashboard/messages', label: '消息中心', icon: MessageCircle, adminOnly: false, badge: unreadCount },
    { href: '/dashboard/announcements', label: '公告中心', icon: MessageSquare, adminOnly: false },
    { href: '/dashboard/users', label: '用户管理', icon: Users, adminOnly: true },
    { href: '/dashboard/settings', label: '系统设置', icon: Settings, adminOnly: false },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ED8936]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* 移动端菜单按钮 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="text-lg font-semibold text-[#2D3748]">OA办公系统</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 侧边栏 - 平板和桌面 */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out shadow-sm
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
                <div className="w-10 h-10 rounded-lg bg-[#ED8936] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">OA</span>
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3">
                    <h1 className="text-lg font-semibold text-[#2D3748]">OA办公系统</h1>
                    <p className="text-xs text-gray-500">高效协作，智能办公</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 用户信息 */}
          <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-10 h-10 rounded-full bg-[#ED8936] flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-[#2D3748] truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`
                    flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4'} py-3 rounded-lg transition-colors group
                    ${isActive 
                      ? 'bg-[#ED8936] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'space-x-3'}`}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && item.badge > 0 && (
                    <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                  {sidebarCollapsed && item.badge && item.badge > 0 && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 折叠按钮 - 平板和桌面 */}
          <div className="hidden md:flex p-2 border-t border-gray-200 justify-center">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          {/* 退出登录 */}
          <div className={`p-2 border-t border-gray-200 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className={`w-full ${sidebarCollapsed ? 'justify-center px-3' : 'justify-start'} text-gray-700 hover:bg-gray-100`}
              title={sidebarCollapsed ? '退出登录' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="ml-3">退出登录</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className={`
        min-h-screen transition-all duration-300
        md:pt-0 pt-16
        ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
      `}>
        {children}
      </main>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
