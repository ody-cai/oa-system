import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key 是否配置
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '邮件服务未配置。请设置环境变量 RESEND_API_KEY。\n\n获取API密钥步骤：\n1. 访问 https://resend.com 注册账号\n2. 在Dashboard中创建API Key\n3. 将API Key设置为环境变量 RESEND_API_KEY' },
        { status: 500 }
      );
    }

    // 初始化 Resend 客户端
    const resend = new Resend(apiKey);

    const body = await request.json();
    const { to, subject, content, html } = body;

    // 验证必填字段
    if (!to || !subject || (!content && !html)) {
      return NextResponse.json(
        { error: '缺少必填字段：收件人、主题、邮件内容' },
        { status: 400 }
      );
    }

    // 发送邮件
    const { data, error } = await resend.emails.send({
      from: 'OA系统 <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      text: content,
      html: html || `<p>${content}</p>`,
    });

    if (error) {
      console.error('发送邮件失败:', error);
      return NextResponse.json(
        { error: `发送邮件失败: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '邮件发送成功',
      data: data
    });
  } catch (error) {
    console.error('邮件发送异常:', error);
    return NextResponse.json(
      { error: '邮件发送失败，请稍后重试' },
      { status: 500 }
    );
  }
}
