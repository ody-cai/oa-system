import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 获取仓库列表
 * GET /api/repositories?userId={userId}
 * 
 * 返回用户有权访问的所有仓库：
 * - 用户自己的所有仓库（公共、私人、群组）
 * - 其他人的公共仓库
 * - 用户作为成员的群组仓库
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 获取用户自己的仓库
    const { data: ownedRepos, error: ownedError } = await client
      .from('repositories')
      .select('*')
      .eq('owner_id', userId);

    if (ownedError) {
      throw new Error(`查询用户仓库失败: ${ownedError.message}`);
    }

    // 获取所有公共仓库（不包括自己的）
    const { data: publicRepos, error: publicError } = await client
      .from('repositories')
      .select('*')
      .eq('type', 'public')
      .neq('owner_id', userId);

    if (publicError) {
      throw new Error(`查询公共仓库失败: ${publicError.message}`);
    }

    // 获取用户作为成员的群组仓库
    const { data: memberData, error: memberError } = await client
      .from('repository_members')
      .select('repository_id')
      .eq('user_id', userId);

    if (memberError) {
      throw new Error(`查询成员仓库失败: ${memberError.message}`);
    }

    let memberRepos: any[] = [];
    if (memberData && memberData.length > 0) {
      const repoIds = memberData.map(m => m.repository_id).filter(id => id);
      
      // 排除自己的仓库
      const { data: repos, error: reposError } = await client
        .from('repositories')
        .select('*')
        .in('id', repoIds)
        .neq('owner_id', userId);

      if (reposError) {
        throw new Error(`查询成员仓库详情失败: ${reposError.message}`);
      }
      memberRepos = repos || [];
    }

    // 按类型分组返回
    const result = {
      owned: ownedRepos || [], // 用户自己的仓库
      public: publicRepos || [], // 其他人的公共仓库
      group: memberRepos // 用户作为成员的群组仓库
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取仓库列表失败:', error);
    return NextResponse.json(
      { error: '获取仓库列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建仓库
 * POST /api/repositories
 * 
 * Body: { name, description, type, ownerId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, ownerId } = body;

    if (!name || !type || !ownerId) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    if (!['public', 'private', 'group'].includes(type)) {
      return NextResponse.json(
        { error: '无效的仓库类型' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查用户是否存在
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, name')
      .eq('id', ownerId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 400 }
      );
    }

    // 创建仓库
    const { data: repository, error } = await client
      .from('repositories')
      .insert({
        name,
        description,
        type,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建仓库失败: ${error.message}`);
    }

    // 如果是群组仓库，自动添加创建者为管理员
    if (type === 'group') {
      const { error: memberError } = await client
        .from('repository_members')
        .insert({
          repository_id: repository.id,
          user_id: ownerId,
          role: 'admin',
          invited_by: ownerId,
        });

      if (memberError) {
        console.error('添加创建者为成员失败:', memberError);
      }
    }

    return NextResponse.json({
      repository,
      message: '仓库创建成功',
    });
  } catch (error) {
    console.error('创建仓库失败:', error);
    return NextResponse.json(
      { error: '创建仓库失败' },
      { status: 500 }
    );
  }
}
