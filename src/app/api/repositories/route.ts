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
      .select(`
        *,
        owner:users!repositories_owner_id_fkey(id, name, email),
        members:repository_members(count)
      `)
      .eq('owner_id', userId);

    if (ownedError) {
      throw new Error(`查询用户仓库失败: ${ownedError.message}`);
    }

    // 获取所有公共仓库
    const { data: publicRepos, error: publicError } = await client
      .from('repositories')
      .select(`
        *,
        owner:users!repositories_owner_id_fkey(id, name, email),
        members:repository_members(count)
      `)
      .eq('type', 'public')
      .neq('owner_id', userId);

    if (publicError) {
      throw new Error(`查询公共仓库失败: ${publicError.message}`);
    }

    // 获取用户作为成员的群组仓库
    const { data: memberRepos, error: memberError } = await client
      .from('repository_members')
      .select(`
        repository:repositories(
          *,
          owner:users!repositories_owner_id_fkey(id, name, email),
          members:repository_members(count)
        )
      `)
      .eq('user_id', userId)
      .neq('repositories.owner_id', userId);

    if (memberError) {
      throw new Error(`查询成员仓库失败: ${memberError.message}`);
    }

    // 合并并去重
    const allRepos = [
      ...(ownedRepos || []),
      ...(publicRepos || []),
      ...(memberRepos?.map(m => m.repository) || [])
    ];

    // 按类型分组返回
    const result = {
      owned: ownedRepos || [], // 用户自己的仓库
      public: publicRepos || [], // 其他人的公共仓库
      group: memberRepos?.map(m => m.repository).filter(Boolean) || [] // 用户作为成员的群组仓库
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

    // 创建仓库（触发器会自动为群组仓库添加创建者为管理员）
    const { data: repository, error } = await client
      .from('repositories')
      .insert({
        name,
        description,
        type,
        owner_id: ownerId,
      })
      .select(`
        *,
        owner:users!repositories_owner_id_fkey(id, name, email)
      `)
      .single();

    if (error) {
      throw new Error(`创建仓库失败: ${error.message}`);
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
