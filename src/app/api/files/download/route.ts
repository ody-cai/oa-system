import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileKey = searchParams.get('key');

    if (!fileKey) {
      return NextResponse.json(
        { error: '文件key不能为空' },
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

    // 生成预签名URL（有效期1天）
    const downloadUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 86400, // 1天
    });

    return NextResponse.json({
      downloadUrl,
    });
  } catch (error) {
    console.error('获取下载链接失败:', error);
    return NextResponse.json(
      { error: '获取下载链接失败' },
      { status: 500 }
    );
  }
}
