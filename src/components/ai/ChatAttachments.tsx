import React, { useRef, useState } from 'react';
import { 
  Paperclip, 
  Image, 
  FileText, 
  File, 
  X, 
  Mic, 
  MicOff,
  Loader2,
  FileSpreadsheet,
  FileType
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ChatAttachment {
  id: string;
  type: 'image' | 'document' | 'audio';
  name: string;
  file: File;
  preview?: string;
}

interface ChatAttachmentsProps {
  attachments: ChatAttachment[];
  onAttachmentsChange: (attachments: ChatAttachment[]) => void;
  disabled?: boolean;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'text/plain',
  'text/csv',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ChatAttachments({ 
  attachments, 
  onAttachmentsChange, 
  disabled = false 
}: ChatAttachmentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: ChatAttachment[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const attachment: ChatAttachment = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        name: file.name,
        file,
      };

      // Generate preview for images
      if (type === 'image') {
        const reader = new FileReader();
        reader.onloadend = () => {
          attachment.preview = reader.result as string;
          onAttachmentsChange([...attachments, ...newAttachments, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        newAttachments.push(attachment);
      }
    });

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }

    // Reset input
    e.target.value = '';
    setIsOpen(false);
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== id));
  };

  const getFileIcon = (attachment: ChatAttachment) => {
    if (attachment.type === 'image') return <Image className="h-3 w-3" />;
    
    const ext = attachment.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileType className="h-3 w-3 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-3 w-3 text-blue-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="h-3 w-3 text-green-500" />;
      default:
        return <File className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_DOC_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'document')}
      />

      {/* Attachment button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => imageInputRef.current?.click()}
            >
              <Image className="h-4 w-4" />
              Upload Image
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Attachment preview bar component
interface AttachmentPreviewBarProps {
  attachments: ChatAttachment[];
  onRemove: (id: string) => void;
}

export function AttachmentPreviewBar({ attachments, onRemove }: AttachmentPreviewBarProps) {
  if (attachments.length === 0) return null;

  const getFileIcon = (attachment: ChatAttachment) => {
    if (attachment.type === 'image') return <Image className="h-3 w-3" />;
    
    const ext = attachment.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileType className="h-3 w-3 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-3 w-3 text-blue-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="h-3 w-3 text-green-500" />;
      default:
        return <File className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex flex-wrap gap-1 px-3 py-1.5 border-t bg-muted/30">
      {attachments.map((attachment) => (
        <Badge
          key={attachment.id}
          variant="secondary"
          className="gap-1 pr-1 text-xs h-6"
        >
          {attachment.type === 'image' && attachment.preview ? (
            <img 
              src={attachment.preview} 
              alt={attachment.name}
              className="h-4 w-4 rounded object-cover"
            />
          ) : (
            getFileIcon(attachment)
          )}
          <span className="max-w-[80px] truncate">{attachment.name}</span>
          <button
            onClick={() => onRemove(attachment.id)}
            className="ml-0.5 hover:bg-muted rounded p-0.5"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

// Voice input button component
interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled = false }: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (chunksRef.current.length > 0) {
          setIsProcessing(true);
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          // For now, we'll just notify the user that voice was captured
          // In a full implementation, this would call an STT API
          toast.info('Voice recording captured. Speech-to-text processing would happen here.');
          onTranscript('[Voice message recorded]');
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started...');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isRecording ? "destructive" : "ghost"}
          size="icon"
          className={cn("h-8 w-8", isRecording && "animate-pulse")}
          onClick={toggleRecording}
          disabled={disabled || isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isRecording ? 'Stop recording' : 'Voice input'}
      </TooltipContent>
    </Tooltip>
  );
}
