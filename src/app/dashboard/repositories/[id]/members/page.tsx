'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  UserPlus,
  ArrowLeft,
  MoreVertical,
  Shield,
  User,
  Trash2,
  Crown,
} from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Repository {
  id: string;
  name: string;
  type: string;
  owner_id: string;
}

export default function RepositoryMembersPage() {
  const params = useParams();
  const router = useRouter();
  const repositoryId = params.id as string;
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      fetchData(user.id);
    } else {
      router.push('/login');
    }
  }, [repositoryId, router]);

  const fetchData = async (userId: string) => {
    try {
      setLoading(true);
      
      // 获取仓库详情
      const repoResponse = await fetch(`/api/repositories/${repositoryId}?userId=${userId}`);
      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        setRepository(repoData.repository);
      }

      // 获取成员列表
      const membersResponse = await fetch(`/api/repositories/${repositoryId}/members?userId=${userId}`);
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData.members || []);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !currentUser) return;

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          inviteeEmail: inviteEmail,
          role: inviteRole,
        }),
      });

      if (response.ok) {
        setInviteDialogOpen(false);
        setInviteEmail('');
        setInviteRole('member');
        fetchData(currentUser.id);
      } else {
        const data = await response.json();
        alert(data.error || '邀请失败');
      }
    } catch (error) {
      console.error('邀请成员失败:', error);
      alert('邀请失败，请重试');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentUser || !confirm('确定要移除这个成员吗？')) return;

    try {
      const response = await fetch(
        `/api/repositories/${repositoryId}/members?userId=${currentUser.id}&memberId=${memberId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchData(currentUser.id);
      } else {
        const data = await response.json();
        alert(data.error || '移除失败');
      }
    } catch (error) {
      console.error('移除成员失败:', error);
      alert('移除失败，请重试');
    }
  };

  const handleUpdateRole = async (memberId: string, role: 'admin' | 'member') => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          memberId,
          role,
        }),
      });

      if (response.ok) {
        fetchData(currentUser.id);
      } else {
        const data = await response.json();
        alert(data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新角色失败:', error);
      alert('更新失败，请重试');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 检查当前用户是否是管理员或仓库所有者
  const canManage = () => {
    if (!currentUser || !repository) return false;
    if (repository.owner_id === currentUser.id) return true;
    const currentMember = members.find((m) => m.user_id === currentUser.id);
    return currentMember?.role === 'admin';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {repository?.name} - 成员管理
          </h1>
          <p className="text-muted-foreground mt-1">
            管理群组仓库的成员和权限
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              成员列表
              <span className="text-sm font-normal text-muted-foreground">
                ({members.length} 人)
              </span>
            </CardTitle>
            {canManage() && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    邀请成员
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>邀请成员</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">成员邮箱</label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="输入成员邮箱"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">角色</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setInviteRole('member')}
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            inviteRole === 'member'
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <User className="w-5 h-5 mx-auto mb-1" />
                          <div className="font-medium text-sm">普通成员</div>
                          <div className="text-xs text-muted-foreground">可查看和下载</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInviteRole('admin')}
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            inviteRole === 'admin'
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Shield className="w-5 h-5 mx-auto mb-1" />
                          <div className="font-medium text-sm">管理员</div>
                          <div className="text-xs text-muted-foreground">可管理成员和文件</div>
                        </button>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleInvite}
                      disabled={!inviteEmail}
                    >
                      发送邀请
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无成员</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>成员</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>加入时间</TableHead>
                  <TableHead>邀请人</TableHead>
                  {canManage() && <TableHead className="w-[100px]">操作</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {member.user.name}
                            {repository?.owner_id === member.user_id && (
                              <span title="所有者">
                                <Crown className="w-4 h-4 text-yellow-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          member.role === 'admin'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {member.role === 'admin' ? '管理员' : '成员'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(member.joined_at)}</TableCell>
                    <TableCell>
                      {member.inviter ? member.inviter.name : '-'}
                    </TableCell>
                    {canManage() && (
                      <TableCell>
                        {repository?.owner_id !== member.user_id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.role === 'member' ? (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(member.id, 'admin')}
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  设为管理员
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(member.id, 'member')}
                                >
                                  <User className="w-4 h-4 mr-2" />
                                  设为普通成员
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                移除成员
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
