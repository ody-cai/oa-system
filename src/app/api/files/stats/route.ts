import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const repositoryId = searchParams.get('repositoryId');
    
    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('files')
      .select('file_size');
    
    // 如果指定了仓库ID，只查询该仓库的文件
    if (repositoryId) {
      query = query.eq('repository_id', repositoryId);
    } else if (userId) {
      // 如果指定了用户ID但未指定仓库，只查询该用户的文件
      query = query.eq('uploader_id', userId);
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
