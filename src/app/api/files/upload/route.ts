import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { S3Storage } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderPath = formData.get('folderPath') as string || '/';
    const userId = formData.get('userId') as string || 'system';

    if (!file) {
      return NextResponse.json(
        { error: '未找到上传文件' },
        { status: 400 }
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

    // 读取文件内容
    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer);

    // 生成文件名（包含文件夹路径）
    const fileName = `${folderPath === '/' ? '' : folderPath}${file.name}`;

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent,
      fileName,
      contentType: file.type,
    });

    // 保存文件元数据到数据库
    const client = getSupabaseClient();
    const { data: fileRecord, error } = await client
      .from('files')
      .insert({
        file_key: fileKey,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        folder_path: folderPath,
        uploader_id: userId,
      })
      .select()
      .single();

    if (error) {
      // 如果数据库保存失败，尝试删除已上传的文件
      await storage.deleteFile({ fileKey });
      throw new Error(`保存文件记录失败: ${error.message}`);
    }

    return NextResponse.json({
      file: fileRecord,
      message: '文件上传成功',
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}
