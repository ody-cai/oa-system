import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化 S3 存储
const storage = new S3Storage();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: '缺少文件ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 获取文件信息
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !file) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    // 生成预签名URL（有效期1小时）
    const signedUrl = await storage.generatePresignedUrl({ 
      key: file.file_key, 
      expireTime: 3600 
    });

    return NextResponse.json({
      previewUrl: signedUrl,
      fileName: file.file_name,
      fileType: file.file_type,
      fileSize: file.file_size,
    });
  } catch (error) {
    console.error('获取预览URL失败:', error);
    return NextResponse.json(
      { error: '获取预览URL失败' },
      { status: 500 }
    );
  }
}
