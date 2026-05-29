'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search,
  UserCheck,
  UserX,
  Trash2,
  HardDrive,
  Mail
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  storage_quota: number;
  created_at: string;
  used_space?: number;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'employee',
  });
  
  // 配额管理
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newQuota, setNewQuota] = useState(10); // GB
  
  // 邮件相关
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailUser, setEmailUser] = useState<User | null>(null);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: '',
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // 复制邮箱
  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      alert('复制失败，请手动复制');
    }
  };

  // 打开发送邮件对话框
  const openEmailDialog = (user: User) => {
    setEmailUser(user);
    setEmailForm({ subject: '', content: '' });
    setEmailDialogOpen(true);
  };

  // 发送邮件
  const handleSendEmail = async () => {
    if (!emailUser || !emailForm.subject || !emailForm.content) {
      alert('请填写邮件主题和内容');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailUser.email,
          subject: emailForm.subject,
          content: emailForm.content,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2D3748;">${emailForm.subject}</h2>
            <p style="color: #4A5568; line-height: 1.6;">${emailForm.content.replace(/\n/g, '<br>')}</p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
            <p style="color: #718096; font-size: 12px;">此邮件由OA办公系统发送</p>
          </div>`
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '发送失败');
      }

      alert('邮件发送成功！');
      setEmailDialogOpen(false);
      setEmailUser(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : '邮件发送失败，请检查是否配置了邮件服务');
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    // 获取当前用户信息
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // 如果不是管理员，跳转到仪表盘
      if (user.role !== 'admin') {
        window.location.href = '/dashboard';
        return;
      }
    }
    
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // 获取用户列表
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        
        // 获取每个用户的已使用空间
        const usersWithUsage = await Promise.all(
          (usersData.users || []).map(async (user: User) => {
            const filesResponse = await fetch(`/api/files/stats?userId=${user.id}`);
            if (filesResponse.ok) {
              const filesData = await filesResponse.json();
              return { ...user, used_space: filesData.total_size || 0 };
            }
            return { ...user, used_space: 0 };
          })
        );
        
        setUsers(usersWithUsage);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.name || !newUser.password) {
      alert('请填写所有必填项');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '创建用户失败');
      }

      await fetchUsers();
      setDialogOpen(false);
      setNewUser({ email: '', name: '', password: '', role: 'employee' });
    } catch (error) {
      alert(error instanceof Error ? error.message : '创建用户失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) throw new Error('更新状态失败');
      
      await fetchUsers();
    } catch (error) {
      alert('更新状态失败，请重试');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`确定要删除用户 "${userName}" 吗？此操作不可恢复。`)) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除用户失败');
      
      await fetchUsers();
    } catch (error) {
      alert('删除用户失败，请重试');
    }
  };

  const handleUpdateQuota = async () => {
    if (!selectedUser) return;
    
    // 转换为字节
    const quotaBytes = newQuota === -1 ? -1 : newQuota * 1024 * 1024 * 1024;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_quota: quotaBytes }),
      });

      if (!response.ok) throw new Error('更新配额失败');
      
      await fetchUsers();
      setQuotaDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      alert('更新配额失败，请重试');
    }
  };

  const openQuotaDialog = (user: User) => {
    setSelectedUser(user);
    // 转换为GB，-1表示无限制
    setNewQuota(user.storage_quota === -1 ? -1 : Math.round(user.storage_quota / (1024 * 1024 * 1024)));
    setQuotaDialogOpen(true);
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatQuota = (quota: number, usedSpace: number) => {
    if (quota === -1) {
      return `${formatFileSize(usedSpace)} / 无限制`;
    }
    return `${formatFileSize(usedSpace)} / ${formatFileSize(quota)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-500">无权访问此页面</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D3748]">用户管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            管理系统用户账户、权限和存储配额
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-[#ED8936] hover:bg-[#DD7730] text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            添加用户
          </button>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>添加新用户</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="用户姓名"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">初始密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="设置初始密码"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="role">角色</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">普通员工</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
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
                  {submitting ? '创建中...' : '创建用户'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="搜索用户姓名或邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-300"
          />
        </div>
      </div>

      {/* 用户列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ED8936]"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? '未找到匹配的用户' : '暂无用户'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#ED8936] flex items-center justify-center">
                      <span className="text-white text-lg font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[#2D3748]">{user.name}</h3>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? '管理员' : '员工'}
                        </Badge>
                        {!user.is_active && (
                          <Badge variant="destructive">已禁用</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        创建于 {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* 存储配额信息 */}
                    <button
                      onClick={() => openQuotaDialog(user)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <HardDrive className="h-4 w-4 text-gray-500" />
                      <div className="text-left">
                        <p className="text-xs text-gray-500">存储空间</p>
                        <p className="text-sm font-medium text-[#2D3748]">
                          {formatQuota(user.storage_quota, user.used_space || 0)}
                        </p>
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {/* 发送邮件按钮 */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEmailDialog(user)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        发邮件
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        className={user.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            禁用
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            启用
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 配额管理弹窗 */}
      <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>调整存储配额</DialogTitle>
            <DialogDescription>
              为用户 {selectedUser?.name} 设置存储空间上限
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>存储配额</Label>
              <Select
                value={newQuota.toString()}
                onValueChange={(value) => setNewQuota(parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 GB</SelectItem>
                  <SelectItem value="10">10 GB</SelectItem>
                  <SelectItem value="20">20 GB</SelectItem>
                  <SelectItem value="50">50 GB</SelectItem>
                  <SelectItem value="100">100 GB</SelectItem>
                  <SelectItem value="-1">无限制（管理员专用）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedUser && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  当前已使用：{formatFileSize(selectedUser.used_space || 0)}
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuotaDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleUpdateQuota}
                className="bg-[#ED8936] hover:bg-[#DD7730]"
              >
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 发送邮件弹窗 */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>发送邮件</DialogTitle>
            <DialogDescription>
              发送邮件给 {emailUser?.name} ({emailUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email-subject">邮件主题</Label>
              <Input
                id="email-subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                placeholder="请输入邮件主题"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email-content">邮件内容</Label>
              <textarea
                id="email-content"
                value={emailForm.content}
                onChange={(e) => setEmailForm({ ...emailForm, content: e.target.value })}
                placeholder="请输入邮件内容..."
                className="mt-1 w-full min-h-[200px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#ED8936] focus:border-transparent"
              />
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-600">
              <p>💡 提示：邮件将通过OA系统发送，发件人地址为 onboarding@resend.dev</p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="bg-[#ED8936] hover:bg-[#DD7730]"
              >
                {sendingEmail ? '发送中...' : '发送邮件'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
