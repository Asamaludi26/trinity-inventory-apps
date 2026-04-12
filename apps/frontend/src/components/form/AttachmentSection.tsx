import type { FC } from 'react';
import { Download, FileText, Image, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUpload } from '@/components/form';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '@/hooks';
import { attachmentApi } from '@/lib/attachment';

interface AttachmentSectionProps {
  entityType: string;
  entityId: string | undefined;
  readOnly?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function isImageType(type: string): boolean {
  return type.startsWith('image/');
}

export const AttachmentSection: FC<AttachmentSectionProps> = ({
  entityType,
  entityId,
  readOnly = false,
}) => {
  const { data: attachments, isLoading } = useAttachments(entityType, entityId);
  const uploadMutation = useUploadAttachment(entityType, entityId);
  const deleteMutation = useDeleteAttachment(entityType, entityId);

  const handleUpload = (files: File[]) => {
    uploadMutation.mutate(files);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const url = attachmentApi.getFileUrl(fileUrl);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Lampiran{' '}
          {attachments && attachments.length > 0 && (
            <span className="text-muted-foreground">({attachments.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Zone */}
        {!readOnly && <FileUpload onUpload={handleUpload} isPending={uploadMutation.isPending} />}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attachment List */}
        {!isLoading && attachments && attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 rounded-lg border p-3">
                {/* Icon / Preview */}
                {isImageType(att.fileType) ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-50 dark:bg-blue-950">
                    <Image className="h-5 w-5 text-blue-500" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-orange-50 dark:bg-orange-950">
                    <FileText className="h-5 w-5 text-orange-500" />
                  </div>
                )}

                {/* File Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{att.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(att.fileSize)} · {att.uploadedBy?.fullName ?? 'Unknown'} ·{' '}
                    {formatDate(att.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(att.fileUrl, att.fileName)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(att.id)}
                      disabled={deleteMutation.isPending}
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!attachments || attachments.length === 0) && readOnly && (
          <p className="py-4 text-center text-sm text-muted-foreground">Tidak ada lampiran</p>
        )}
      </CardContent>
    </Card>
  );
};
