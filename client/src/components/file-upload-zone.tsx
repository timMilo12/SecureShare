import { useCallback, useState } from "react";
import { CloudUpload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";

interface FileUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function FileUploadZone({ files, onFilesChange, disabled = false }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesChange([...files, ...droppedFiles]);
  }, [files, onFilesChange, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      onFilesChange([...files, ...selectedFiles]);
    }
  }, [files, onFilesChange]);

  const removeFile = useCallback((index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  }, [files, onFilesChange]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover-elevate'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        data-testid="file-upload-zone"
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          data-testid="input-file"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <CloudUpload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-base font-medium">
              Click or drag files here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              No file size limit
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2" data-testid="file-list">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate"
              data-testid={`file-item-${index}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid={`file-name-${index}`}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`file-size-${index}`}>
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  removeFile(index);
                }}
                disabled={disabled}
                data-testid={`button-remove-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
