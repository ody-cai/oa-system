import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 查询文件总数和总大小
    const { data: files, error } = await client
      .from('files')
      .select('file_size');

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
