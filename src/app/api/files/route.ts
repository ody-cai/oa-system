import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

  // 公共仓库所有人都可以访问
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

/**
 * 获取文件列表
 * GET /api/files?path={path}&repositoryId={repositoryId}&userId={userId}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path') || '/';
    const repositoryId = searchParams.get('repositoryId');
    const userId = searchParams.get('userId');

    const client = getSupabaseClient();

    // 如果指定了仓库，检查访问权限
    if (repositoryId && userId) {
      const { canAccess } = await checkRepositoryAccess(client, repositoryId, userId);
      if (!canAccess) {
        return NextResponse.json(
          { error: '无权访问此仓库' },
          { status: 403 }
        );
      }
    }

    // 构建查询
    let query = client
      .from('files')
      .select(`
        *,
        uploader:users!files_uploader_id_fkey(id, name, email),
        repository:repositories(id, name, type)
      `)
      .eq('folder_path', path)
      .order('created_at', { ascending: false });

    // 如果指定了仓库，过滤文件
    if (repositoryId) {
      query = query.eq('repository_id', repositoryId);
    }

    const { data: files, error } = await query;

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
