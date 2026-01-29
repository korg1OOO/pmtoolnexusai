import React, { useRef, useState } from 'react';
import { Paperclip, Image, File, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatAttachmentProps {
  onAttach: (attachment: AttachmentData) => void;
  disabled?: boolean;
}

export interface AttachmentData {
  url: string;
  name: string;
  type: string;
  size: number;
}

export function ChatAttachmentButton({ onAttach, disabled }: ChatAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('You must be logged in to upload files');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(data.path);

      onAttach({
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      });

      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      <Button
        type="button"
        variant="ghost"
        size="iconSm"
        disabled={disabled || isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}

interface AttachmentPreviewProps {
  attachment: AttachmentData;
  onRemove?: () => void;
  className?: string;
}

export function AttachmentPreview({ attachment, onRemove, className }: AttachmentPreviewProps) {
  const isImage = attachment.type.startsWith('image/');
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('relative group', className)}>
      {isImage ? (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-[200px] max-h-[150px] rounded-md object-cover border"
          />
        </a>
      ) : (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
        >
          <File className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[150px]">{attachment.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(attachment.size)}</p>
          </div>
        </a>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

interface AttachmentDisplayProps {
  url: string;
  name: string;
  type: string;
  size: number;
}

export function AttachmentDisplay({ url, name, type, size }: AttachmentDisplayProps) {
  const isImage = type.startsWith('image/');
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img
          src={url}
          alt={name}
          className="max-w-full max-h-[200px] rounded-md object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 mt-1 px-2 py-1.5 bg-background/50 rounded text-xs hover:bg-background/80 transition-colors"
    >
      <File className="h-3 w-3" />
      <span className="truncate max-w-[120px]">{name}</span>
      <span className="text-muted-foreground">({formatSize(size)})</span>
    </a>
  );
}
