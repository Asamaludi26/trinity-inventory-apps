import { useCallback, useRef, useState } from 'react';
import type { FC } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  isPending?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
}

const ACCEPT_DEFAULT =
  'image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(type: string): boolean {
  return type.startsWith('image/');
}

export const FileUpload: FC<FileUploadProps> = ({
  onUpload,
  isPending = false,
  maxFiles = 5,
  maxSizeMB = 10,
  accept = ACCEPT_DEFAULT,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const validFiles: File[] = [];
      const maxSize = maxSizeMB * 1024 * 1024;

      for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
        const file = files[i];
        if (file.size <= maxSize) {
          validFiles.push(file);
        }
      }

      setSelectedFiles((prev) => {
        const combined = [...prev, ...validFiles].slice(0, maxFiles);
        return combined;
      });
    },
    [maxFiles, maxSizeMB],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    },
    [handleFiles],
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFiles.length === 0) return;
    onUpload(selectedFiles);
    setSelectedFiles([]);
  }, [selectedFiles, onUpload]);

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drag & drop file atau <span className="text-primary underline">pilih file</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Maks. {maxFiles} file, {maxSizeMB}MB per file. JPG, PNG, PDF, DOC, XLS
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, idx) => (
            <Card key={`${file.name}-${idx}`}>
              <CardContent className="flex items-center gap-3 p-3">
                {isImageType(file.type) ? (
                  <Image className="h-5 w-5 shrink-0 text-blue-500" />
                ) : (
                  <FileText className="h-5 w-5 shrink-0 text-orange-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeFile(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}

          <Button onClick={handleUpload} disabled={isPending} size="sm" className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            {isPending ? 'Mengupload...' : `Upload ${selectedFiles.length} File`}
          </Button>
        </div>
      )}
    </div>
  );
};
