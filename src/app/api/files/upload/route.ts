import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { S3Storage } from 'coze-coding-dev-sdk';

/**
 * 检查用户对仓库的访问权限
 */
async function checkRepositoryAccess(
  client: ReturnType<typeof getSupabaseClient>,
  repositoryId: string,
  userId: string
): Promise<{ canAccess: boolean; canEdit: boolean; repository: any }> {
  // 获取仓库信息
  const { data: repo, error } = await client
    .from('repositories')
    .select('*')
    .eq('id', repositoryId)
    .single();

  if (error || !repo) {
    return { canAccess: false, canEdit: false, repository: null };
  }

  // 所有者拥有所有权限
  if (repo.owner_id === userId) {
    return { canAccess: true, canEdit: true, repository: repo };
  }

  // 公共仓库所有人都可以访问，但只有所有者可以编辑
  if (repo.type === 'public') {
    return { canAccess: true, canEdit: false, repository: repo };
  }

  // 群组仓库需要检查成员身份
  if (repo.type === 'group') {
    const { data: member } = await client
      .from('repository_members')
      .select('role')
      .eq('repository_id', repositoryId)
      .eq('user_id', userId)
      .single();

    if (member) {
      return {
        canAccess: true,
        canEdit: member.role === 'admin',
        repository: repo,
      };
    }
  }

  // 私人仓库只有所有者可以访问
  return { canAccess: false, canEdit: false, repository: repo };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderPath = formData.get('folderPath') as string || '/';
    const userId = formData.get('userId') as string || 'system';
    const repositoryId = formData.get('repositoryId') as string || null;

    if (!file) {
      return NextResponse.json(
        { error: '未找到上传文件' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 如果指定了仓库，检查权限
    if (repositoryId) {
      const { canEdit } = await checkRepositoryAccess(client, repositoryId, userId);
      if (!canEdit) {
        return NextResponse.json(
          { error: '无权在此仓库上传文件' },
          { status: 403 }
        );
      }
    }

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
        repository_id: repositoryId || null,
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
