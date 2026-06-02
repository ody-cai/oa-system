import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function getFileStats(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestUserId = searchParams.get('userId');
    
    const client = getSupabaseClient();
    
    // 确定查询的用户ID：普通用户只能查自己的，管理员可以查所有或指定的
    let targetUserId = request.user.userId;
    if (requestUserId && request.user.role === 'admin') {
      targetUserId = requestUserId;
    }
    
    // 构建查询
    let query = client
      .from('files')
      .select('file_size');
    
    // 如果指定了用户ID，只查询该用户的文件
    if (targetUserId) {
      query = query.eq('uploader_id', targetUserId);
    }

    const { data: files, error } = await query;

    if (error) {
      throw new Error(`查询文件统计失败: ${error.message}`);
    }

    const totalFiles = files?.length || 0;
    const totalSize = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;

    return NextResponse.json({
      total_files: totalFiles,
      total_size: totalSize,
    });
  } catch (error) {
    console.error('获取文件统计失败:', error);
    return NextResponse.json(
      { error: '获取文件统计失败' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFileStats);
