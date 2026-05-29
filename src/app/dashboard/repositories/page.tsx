'use client';

import { useState, useEffect } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  Plus,
  Lock,
  Globe,
  Users,
  MoreVertical,
  Settings,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'group';
  owner_id: string;
  created_at: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  members?: Array<{
    id: string;
    user_id: string;
    role: string;
  }>;
}

interface RepositoriesResponse {
  owned: Repository[];
  public: Repository[];
  group: Repository[];
}

export default function RepositoriesPage() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<RepositoriesResponse>({
    owned: [],
    public: [],
    group: [],
  });
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRepo, setNewRepo] = useState({
    name: '',
    description: '',
    type: 'private' as 'public' | 'private' | 'group',
  });
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    // 获取当前用户
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      fetchRepositories(user.id);
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchRepositories = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/repositories?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRepositories(data);
      }
    } catch (error) {
      console.error('获取仓库列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepository = async () => {
    if (!newRepo.name || !currentUser) return;

    try {
      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRepo,
          ownerId: currentUser.id,
        }),
      });

      if (response.ok) {
        setCreateDialogOpen(false);
        setNewRepo({ name: '', description: '', type: 'private' });
        fetchRepositories(currentUser.id);
      } else {
        const data = await response.json();
        alert(data.error || '创建失败');
      }
    } catch (error) {
      console.error('创建仓库失败:', error);
      alert('创建失败，请重试');
    }
  };

  const handleDeleteRepository = async (repoId: string) => {
    if (!currentUser || !confirm('确定要删除这个仓库吗？所有文件将被删除。')) return;

    try {
      const response = await fetch(`/api/repositories/${repoId}?userId=${currentUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRepositories(currentUser.id);
      } else {
        const data = await response.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除仓库失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleOpenRepository = (repoId: string) => {
    router.push(`/dashboard/files?repositoryId=${repoId}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <Globe className="w-5 h-5 text-green-500" />;
      case 'private':
        return <Lock className="w-5 h-5 text-orange-500" />;
      case 'group':
        return <Users className="w-5 h-5 text-blue-500" />;
      default:
        return <FolderOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'public':
        return '公共仓库';
      case 'private':
        return '私人仓库';
      case 'group':
        return '群组仓库';
      default:
        return '未知';
    }
  };

  const RepositoryCard = ({ repo, showOwner = false }: { repo: Repository; showOwner?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenRepository(repo.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getTypeIcon(repo.type)}
            <div>
              <CardTitle className="text-lg">{repo.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{repo.description || '暂无描述'}</p>
            </div>
          </div>
          {(repo.owner_id === currentUser?.id || repo.type === 'group') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleOpenRepository(repo.id);
                }}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  打开仓库
                </DropdownMenuItem>
                {repo.type === 'group' && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/repositories/${repo.id}/members`);
                  }}>
                    <Users className="w-4 h-4 mr-2" />
                    管理成员
                  </DropdownMenuItem>
                )}
                {repo.owner_id === currentUser?.id && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRepository(repo.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除仓库
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-muted rounded text-xs">{getTypeName(repo.type)}</span>
            {showOwner && repo.owner && (
              <span>创建者: {repo.owner.name}</span>
            )}
          </div>
          {repo.type === 'group' && repo.members && (
            <span>{repo.members.length} 成员</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">云存储仓库</h1>
          <p className="text-muted-foreground mt-1">管理您的公共、私人和群组仓库</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新建仓库
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新仓库</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">仓库名称</label>
                <Input
                  value={newRepo.name}
                  onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                  placeholder="输入仓库名称"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">仓库描述</label>
                <Input
                  value={newRepo.description}
                  onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                  placeholder="输入仓库描述（可选）"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">仓库类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'private', label: '私人', icon: Lock, desc: '仅自己可见' },
                    { value: 'public', label: '公共', icon: Globe, desc: '所有人可见' },
                    { value: 'group', label: '群组', icon: Users, desc: '邀请成员可见' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewRepo({ ...newRepo, type: option.value as typeof newRepo.type })}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        newRepo.type === option.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <option.icon className={`w-5 h-5 mx-auto mb-1 ${
                        newRepo.type === option.value ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateRepository}
                disabled={!newRepo.name}
              >
                创建仓库
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="owned" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="owned">
            <Lock className="w-4 h-4 mr-2" />
            我的仓库
          </TabsTrigger>
          <TabsTrigger value="public">
            <Globe className="w-4 h-4 mr-2" />
            公共仓库
          </TabsTrigger>
          <TabsTrigger value="group">
            <Users className="w-4 h-4 mr-2" />
            群组仓库
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owned" className="mt-6">
          {repositories.owned.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无仓库</p>
              <p className="text-sm mt-1">点击右上角"新建仓库"创建您的第一个仓库</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.owned.map((repo) => (
                <RepositoryCard key={repo.id} repo={repo} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          {repositories.public.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无公共仓库</p>
              <p className="text-sm mt-1">公共仓库所有人都可以访问</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.public.map((repo) => (
                <RepositoryCard key={repo.id} repo={repo} showOwner />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="group" className="mt-6">
          {repositories.group.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无群组仓库</p>
              <p className="text-sm mt-1">您需要被邀请才能加入群组仓库</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.group.map((repo) => (
                <RepositoryCard key={repo.id} repo={repo} showOwner />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
