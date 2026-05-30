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
 * 获取仓库详情
 * GET /api/repositories/{id}?userId={userId}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查访问权限
    const { canAccess, repository } = await checkRepositoryAccess(client, id, userId);

    if (!canAccess) {
      return NextResponse.json(
        { error: '无权访问此仓库' },
        { status: 403 }
      );
    }

    // 获取仓库详细信息
    const { data: repoDetail, error } = await client
      .from('repositories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`查询仓库详情失败: ${error.message}`);
    }

    return NextResponse.json({ repository: repoDetail });
  } catch (error) {
    console.error('获取仓库详情失败:', error);
    return NextResponse.json(
      { error: '获取仓库详情失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新仓库信息
 * PATCH /api/repositories/{id}
 * 
 * Body: { name?, description?, type?, userId }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, type, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查权限（只有所有者可以修改）
    const { canEdit, repository } = await checkRepositoryAccess(client, id, userId);

    if (!canEdit) {
      return NextResponse.json(
        { error: '无权修改此仓库' },
        { status: 403 }
      );
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type && ['public', 'private', 'group'].includes(type)) {
      // 如果从群组改为其他类型，需要处理成员
      if (repository.type === 'group' && type !== 'group') {
        // 删除所有成员（除了所有者）
        await client
          .from('repository_members')
          .delete()
          .eq('repository_id', id)
          .neq('user_id', repository.owner_id);
      }
      updateData.type = type;
    }

    const { data: updatedRepo, error } = await client
      .from('repositories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新仓库失败: ${error.message}`);
    }

    return NextResponse.json({
      repository: updatedRepo,
      message: '仓库更新成功',
    });
  } catch (error) {
    console.error('更新仓库失败:', error);
    return NextResponse.json(
      { error: '更新仓库失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除仓库
 * DELETE /api/repositories/{id}?userId={userId}
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查权限（只有所有者可以删除）
    const { canEdit } = await checkRepositoryAccess(client, id, userId);

    if (!canEdit) {
      return NextResponse.json(
        { error: '无权删除此仓库' },
        { status: 403 }
      );
    }

    // 删除仓库（级联删除成员和邀请）
    const { error } = await client
      .from('repositories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除仓库失败: ${error.message}`);
    }

    return NextResponse.json({
      message: '仓库删除成功',
    });
  } catch (error) {
    console.error('删除仓库失败:', error);
    return NextResponse.json(
      { error: '删除仓库失败' },
      { status: 500 }
    );
  }
}

export { checkRepositoryAccess };
