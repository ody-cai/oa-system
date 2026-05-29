import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { checkRepositoryAccess } from '../route';

/**
 * 获取仓库成员列表
 * GET /api/repositories/{id}/members?userId={userId}
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

    // 只有群组仓库有成员
    if (repository.type !== 'group') {
      return NextResponse.json({ members: [] });
    }

    // 获取成员列表
    const { data: members, error } = await client
      .from('repository_members')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        invited_by,
        user:users(id, name, email, role as user_role),
        inviter:users!repository_members_invited_by_fkey(id, name, email)
      `)
      .eq('repository_id', id)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`查询成员列表失败: ${error.message}`);
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('获取成员列表失败:', error);
    return NextResponse.json(
      { error: '获取成员列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 邀请成员加入群组仓库
 * POST /api/repositories/{id}/members
 * 
 * Body: { userId, inviteeEmail, role }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, inviteeEmail, role = 'member' } = body;

    if (!userId || !inviteeEmail) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查权限（需要管理员权限）
    const { canEdit, repository } = await checkRepositoryAccess(client, id, userId);

    if (!canEdit) {
      return NextResponse.json(
        { error: '无权邀请成员' },
        { status: 403 }
      );
    }

    // 只有群组仓库可以邀请成员
    if (repository.type !== 'group') {
      return NextResponse.json(
        { error: '只有群组仓库可以邀请成员' },
        { status: 400 }
      );
    }

    // 查找被邀请的用户
    const { data: invitee, error: inviteeError } = await client
      .from('users')
      .select('id, name, email')
      .eq('email', inviteeEmail)
      .single();

    if (inviteeError || !invitee) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 400 }
      );
    }

    // 检查是否已经是成员
    const { data: existingMember } = await client
      .from('repository_members')
      .select('id')
      .eq('repository_id', id)
      .eq('user_id', invitee.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: '该用户已是仓库成员' },
        { status: 400 }
      );
    }

    // 直接添加成员（简化流程，不使用邀请确认）
    const { data: member, error } = await client
      .from('repository_members')
      .insert({
        repository_id: id,
        user_id: invitee.id,
        role,
        invited_by: userId,
      })
      .select(`
        id,
        user_id,
        role,
        joined_at,
        user:users(id, name, email)
      `)
      .single();

    if (error) {
      throw new Error(`添加成员失败: ${error.message}`);
    }

    return NextResponse.json({
      member,
      message: '成员添加成功',
    });
  } catch (error) {
    console.error('邀请成员失败:', error);
    return NextResponse.json(
      { error: '邀请成员失败' },
      { status: 500 }
    );
  }
}

/**
 * 移除成员
 * DELETE /api/repositories/{id}/members?userId={userId}&memberId={memberId}
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const memberId = searchParams.get('memberId');

    if (!userId || !memberId) {
      return NextResponse.json(
        { error: '缺少必填参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查权限
    const { canEdit, repository } = await checkRepositoryAccess(client, id, userId);

    if (!canEdit) {
      return NextResponse.json(
        { error: '无权移除成员' },
        { status: 403 }
      );
    }

    // 获取要移除的成员信息
    const { data: member, error: memberError } = await client
      .from('repository_members')
      .select('id, user_id, role')
      .eq('id', memberId)
      .eq('repository_id', id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: '成员不存在' },
        { status: 404 }
      );
    }

    // 不能移除仓库所有者
    if (member.user_id === repository.owner_id) {
      return NextResponse.json(
        { error: '不能移除仓库所有者' },
        { status: 400 }
      );
    }

    // 删除成员
    const { error } = await client
      .from('repository_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      throw new Error(`移除成员失败: ${error.message}`);
    }

    return NextResponse.json({
      message: '成员移除成功',
    });
  } catch (error) {
    console.error('移除成员失败:', error);
    return NextResponse.json(
      { error: '移除成员失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新成员角色
 * PATCH /api/repositories/{id}/members
 * 
 * Body: { userId, memberId, role }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, memberId, role } = body;

    if (!userId || !memberId || !role) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: '无效的角色' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 检查权限
    const { canEdit } = await checkRepositoryAccess(client, id, userId);

    if (!canEdit) {
      return NextResponse.json(
        { error: '无权修改成员角色' },
        { status: 403 }
      );
    }

    // 更新角色
    const { data: updatedMember, error } = await client
      .from('repository_members')
      .update({ role })
      .eq('id', memberId)
      .eq('repository_id', id)
      .select(`
        id,
        user_id,
        role,
        user:users(id, name, email)
      `)
      .single();

    if (error) {
      throw new Error(`更新成员角色失败: ${error.message}`);
    }

    return NextResponse.json({
      member: updatedMember,
      message: '成员角色更新成功',
    });
  } catch (error) {
    console.error('更新成员角色失败:', error);
    return NextResponse.json(
      { error: '更新成员角色失败' },
      { status: 500 }
    );
  }
}
