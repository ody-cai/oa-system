import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function getFiles(request: AuthenticatedRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path') || '/';

    const client = getSupabaseClient();
    
    // 查询指定路径下的文件
    const { data: files, error } = await client
      .from('files')
      .select('*')
      .eq('folder_path', path)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`查询文件失败: ${error.message}`);
    }

    return NextResponse.json({
      files: files || [],
    });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return NextResponse.json(
      { error: '获取文件列表失败' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFiles);
