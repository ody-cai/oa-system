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
  Sun,
  Moon
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 仅在客户端执行
    if (typeof window === 'undefined') return;
    
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  // 深色模式初始化
  useEffect(() => {
    // 仅在客户端执行
    if (typeof window === 'undefined') return;
    
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  // 深色模式切换
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // 发送在线心跳
  useEffect(() => {
    if (user) {
      const sendHeartbeat = async () => {
        try {
          await fetch('/api/users/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      };
      
      // 立即发送一次
      sendHeartbeat();
      // 每30秒发送心跳
      const interval = setInterval(sendHeartbeat, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 移动端菜单按钮 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
          </button>
          <h1 className="text-lg font-semibold text-foreground">OA办公系统</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 侧边栏 */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-lg">OA</span>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-foreground">OA办公系统</h1>
                <p className="text-xs text-muted-foreground">高效协作，智能办公</p>
              </div>
            </div>
          </div>

          {/* 用户信息 */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                {/* 在线状态指示器 */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full"></div>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
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
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg transition-colors group
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-muted'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 深色模式切换 */}
          <div className="p-2 border-t border-border">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-start px-4 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              {isDarkMode ? <Sun className="h-5 w-5 flex-shrink-0" /> : <Moon className="h-5 w-5 flex-shrink-0" />}
              <span className="ml-3">{isDarkMode ? '浅色模式' : '深色模式'}</span>
            </button>
          </div>

          {/* 退出登录 */}
          <div className="p-2 border-t border-border">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-foreground hover:bg-muted"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3">退出登录</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="min-h-screen bg-background md:ml-64 pt-16 md:pt-0">
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
