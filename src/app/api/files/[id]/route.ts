import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { S3Storage } from 'coze-coding-dev-sdk';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;

    if (!fileId) {
      return NextResponse.json(
        { error: '文件ID不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 查询文件信息
    const { data: file, error: queryError } = await client
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (queryError || !file) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    // 初始化 S3 存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    // 删除对象存储中的文件
    await storage.deleteFile({ fileKey: file.file_key });

    // 删除数据库记录
    const { error: deleteError } = await client
      .from('files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      throw new Error(`删除文件记录失败: ${deleteError.message}`);
    }

    return NextResponse.json({
      message: '文件删除成功',
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    return NextResponse.json(
      { error: '删除文件失败' },
      { status: 500 }
    );
  }
}
