'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, FileText, FileImage, FileVideo, FileAudio, FileCode } from 'lucide-react';

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string | null;
  fileName?: string;
}

interface FileInfo {
  previewUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

// 文件类型分类
const getFileCategory = (fileType: string): string => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/ico'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
  const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'];
  const pdfTypes = ['application/pdf'];
  const docTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const sheetTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const pptTypes = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  const textTypes = ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'text/javascript', 'text/css', 'text/html'];
  const codeTypes = ['application/javascript', 'application/typescript', 'application/x-python', 'text/x-python'];

  if (imageTypes.includes(fileType)) return 'image';
  if (videoTypes.includes(fileType)) return 'video';
  if (audioTypes.includes(fileType)) return 'audio';
  if (pdfTypes.includes(fileType)) return 'pdf';
  if ([...docTypes, ...sheetTypes, ...pptTypes].includes(fileType)) return 'office';
  if (textTypes.includes(fileType)) return 'text';
  if (codeTypes.includes(fileType)) return 'code';

  return 'other';
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FilePreviewDialog({
  open,
  onOpenChange,
  fileId,
  fileName: propFileName,
}: FilePreviewDialogProps) {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && fileId) {
      fetchPreviewUrl();
    } else {
      setFileInfo(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileId]);

  const fetchPreviewUrl = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files/preview?fileId=${fileId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取预览失败');
      }

      setFileInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取预览失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fileInfo) return;

    try {
      const response = await fetch(fileInfo.previewUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('下载失败:', err);
    }
  };

  const renderPreview = () => {
    if (!fileInfo) return null;

    const category = getFileCategory(fileInfo.fileType);

    switch (category) {
      case 'image':
        return (
          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg overflow-auto">
            <img
              src={fileInfo.previewUrl}
              alt={fileInfo.fileName}
              className="max-w-full max-h-[60vh] object-contain rounded shadow-lg"
            />
          </div>
        );

      case 'video':
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              src={fileInfo.previewUrl}
              controls
              className="w-full max-h-[60vh]"
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <FileAudio className="w-20 h-20 text-primary mb-4" />
            <p className="text-lg font-medium mb-4">{fileInfo.fileName}</p>
            <audio
              src={fileInfo.previewUrl}
              controls
              className="w-full max-w-md"
            >
              您的浏览器不支持音频播放
            </audio>
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-[60vh] bg-muted/30 rounded-lg overflow-hidden">
            <iframe
              src={fileInfo.previewUrl}
              className="w-full h-full border-0"
              title={fileInfo.fileName}
            />
          </div>
        );

      case 'office':
        // 使用 Office Online 预览服务
        const officePreviewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileInfo.previewUrl)}`;
        return (
          <div className="w-full h-[60vh] bg-muted/30 rounded-lg overflow-hidden">
            <iframe
              src={officePreviewUrl}
              className="w-full h-full border-0"
              title={fileInfo.fileName}
            />
          </div>
        );

      case 'text':
      case 'code':
        return (
          <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-[60vh]">
            <iframe
              src={fileInfo.previewUrl}
              className="w-full h-[50vh] text-white font-mono text-sm"
              title={fileInfo.fileName}
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-lg">
            <FileText className="w-20 h-20 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">{fileInfo.fileName}</p>
            <p className="text-sm text-muted-foreground mb-4">
              此文件类型暂不支持在线预览
            </p>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              下载文件
            </Button>
          </div>
        );
    }
  };

  const getCategoryIcon = () => {
    if (!fileInfo) return <FileText className="w-5 h-5" />;
    
    const category = getFileCategory(fileInfo.fileType);
    switch (category) {
      case 'image':
        return <FileImage className="w-5 h-5" />;
      case 'video':
        return <FileVideo className="w-5 h-5" />;
      case 'audio':
        return <FileAudio className="w-5 h-5" />;
      case 'code':
        return <FileCode className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              {getCategoryIcon()}
              <DialogTitle className="truncate max-w-[400px] md:max-w-[600px]">
                {fileInfo?.fileName || propFileName || '文件预览'}
              </DialogTitle>
            </div>
          </div>
          {fileInfo && (
            <p className="text-sm text-muted-foreground mt-1">
              大小：{formatFileSize(fileInfo.fileSize)}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {loading && (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">加载中...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center">
                <X className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && fileInfo && renderPreview()}
        </div>

        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          {fileInfo && (
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              下载文件
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
