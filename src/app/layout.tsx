import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'OA办公自动化系统',
    template: '%s | OA办公系统',
  },
  description:
    '企业级OA办公自动化系统，集成文件管理、公告发布、即时通讯、用户管理等核心办公功能，提升团队协作效率。',
  keywords: [
    'OA系统',
    '办公自动化',
    '企业办公',
    '文件管理',
    '协同办公',
    '即时通讯',
    '公告管理',
    '团队协作',
  ],
  authors: [{ name: 'OA System Team' }],
  generator: 'Next.js',
  openGraph: {
    title: 'OA办公自动化系统',
    description:
      '企业级OA办公自动化系统，集成文件管理、公告发布、即时通讯等核心功能，提升团队协作效率。',
    siteName: 'OA办公系统',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
