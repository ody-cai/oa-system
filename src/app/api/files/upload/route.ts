import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { S3Storage } from 'coze-coding-dev-sdk';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function uploadFile(request: AuthenticatedRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderPath = formData.get('folderPath') as string || '/';

    if (!file) {
      return NextResponse.json(
        { error: '未找到上传文件' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const userId = request.user.userId;

    // 查询用户配额
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, role, storage_quota')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 400 }
      );
    }

    // 查询用户已使用的存储空间
    const { data: userFiles } = await client
      .from('files')
      .select('file_size')
      .eq('uploader_id', userId);

    const usedSpace = userFiles?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0;
    const fileSize = file.size;

    // 检查配额（-1表示无限制）
    if (user.storage_quota !== -1 && usedSpace + fileSize > user.storage_quota) {
      const quotaGB = (user.storage_quota / (1024 * 1024 * 1024)).toFixed(2);
      const usedGB = (usedSpace / (1024 * 1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `存储空间不足。已使用 ${usedGB}GB / ${quotaGB}GB` },
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
      used_space: usedSpace + fileSize,
      storage_quota: user.storage_quota,
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(uploadFile);
