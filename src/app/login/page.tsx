'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      // 保存用户信息到 localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] px-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-[#2D3748]">
              OA办公系统
            </CardTitle>
            <CardDescription className="text-gray-600">
              登录您的账户以继续
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-gray-300 focus:border-[#ED8936] focus:ring-[#ED8936]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-gray-300 focus:border-[#ED8936] focus:ring-[#ED8936]"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-600">记住密码</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-[#ED8936] hover:underline"
                >
                  忘记密码？
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#ED8936] hover:bg-[#DD7730] text-white"
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                还没有账户？{' '}
                <button
                  type="button"
                  onClick={() => setShowContactAdmin(true)}
                  className="text-[#ED8936] hover:underline"
                >
                  联系管理员
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 忘记密码弹窗 */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>忘记密码</DialogTitle>
            <DialogDescription>
              如果您忘记了密码,请联系系统管理员重置密码。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">管理员联系方式：</p>
              <p className="text-sm font-medium text-[#2D3748]">邮箱：admin@oa.com</p>
              <p className="text-sm text-gray-500 mt-1">请发送邮件说明您的账户邮箱，管理员会为您重置密码。</p>
            </div>
            <Button
              onClick={() => setShowForgotPassword(false)}
              className="w-full bg-[#ED8936] hover:bg-[#DD7730]"
            >
              我知道了
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 联系管理员弹窗 */}
      <Dialog open={showContactAdmin} onOpenChange={setShowContactAdmin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>联系管理员</DialogTitle>
            <DialogDescription>
              如需开通账户或遇到问题，请联系系统管理员。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">管理员联系方式：</p>
              <p className="text-sm font-medium text-[#2D3748]">邮箱：admin@oa.com</p>
              <p className="text-sm text-gray-500 mt-1">
                请发送邮件至管理员邮箱，说明您的姓名、部门及需要开通的权限。
              </p>
            </div>
            <Button
              onClick={() => setShowContactAdmin(false)}
              className="w-full bg-[#ED8936] hover:bg-[#DD7730]"
            >
              我知道了
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
