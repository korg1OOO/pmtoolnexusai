import React, { useState, useCallback } from 'react';
import { Upload, FileText, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TranscriptUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
  onUploadTranscript: (transcript: string) => Promise<void>;
  onProcessWithAI: () => Promise<void>;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export function TranscriptUploadDialog({
  open,
  onOpenChange,
  meetingId,
  meetingTitle,
  onUploadTranscript,
  onProcessWithAI,
}: TranscriptUploadDialogProps) {
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Check file type
    const validTypes = ['text/plain', 'text/vtt', 'text/srt', 'application/json'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|vtt|srt|json)$/)) {
      setError('Please upload a text file (.txt, .vtt, .srt, or .json)');
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress((e.loaded / e.total) * 50);
        }
      };
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Parse VTT/SRT if needed
        const cleanedTranscript = parseTranscript(content, file.name);
        setTranscript(cleanedTranscript);
        setProgress(100);
        setStatus('idle');
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setStatus('error');
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Failed to process file');
      setStatus('error');
    }
  };

  const parseTranscript = (content: string, filename: string): string => {
    // Handle VTT format
    if (filename.endsWith('.vtt')) {
      return content
        .split('\n')
        .filter((line) => !line.match(/^WEBVTT/) && !line.match(/^\d{2}:\d{2}/) && line.trim())
        .join('\n');
    }

    // Handle SRT format
    if (filename.endsWith('.srt')) {
      return content
        .split('\n')
        .filter((line) => !line.match(/^\d+$/) && !line.match(/^\d{2}:\d{2}/) && line.trim())
        .join('\n');
    }

    // Handle JSON (common for Teams/Zoom exports)
    if (filename.endsWith('.json')) {
      try {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          return data.map((item) => `${item.speaker || ''}: ${item.text || item.content || ''}`).join('\n');
        }
        return content;
      } catch {
        return content;
      }
    }

    return content;
  };

  const handleUploadAndProcess = async () => {
    if (!transcript.trim()) {
      setError('Please provide a transcript');
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      // Simulate progress for upload
      setProgress(30);
      await onUploadTranscript(transcript);
      setProgress(50);

      setStatus('processing');
      // Process with AI
      await onProcessWithAI();
      setProgress(100);

      setStatus('complete');
      
      // Close dialog after short delay
      setTimeout(() => {
        onOpenChange(false);
        setTranscript('');
        setStatus('idle');
        setProgress(0);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process transcript');
      setStatus('error');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading transcript...';
      case 'processing':
        return 'AI is extracting insights...';
      case 'complete':
        return 'Processing complete!';
      case 'error':
        return error || 'An error occurred';
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Upload Transcript
          </DialogTitle>
          <DialogDescription>
            Upload or paste the transcript for "{meetingTitle}" to extract AI insights
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-4">
            <div className="space-y-2">
              <Label htmlFor="transcript">Meeting Transcript</Label>
              <Textarea
                id="transcript"
                placeholder="Paste your meeting transcript here...

Example:
John: Let's discuss the project timeline.
Sarah: I think we should push the deadline by two weeks.
John: Agreed. Let's also add more resources to the team.
Sarah: I'll create an action item for that."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Include speaker names for better AI extraction (e.g., "Speaker: text")
              </p>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                status === 'uploading' && 'pointer-events-none opacity-50'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium mb-1">
                Drag and drop your transcript file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports .txt, .vtt, .srt, and .json files
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".txt,.vtt,.srt,.json"
                onChange={handleFileInput}
              />
              <Button variant="outline" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </div>

            {transcript && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Transcript loaded</span>
                  <Badge variant="success">
                    {transcript.split('\n').length} lines
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {transcript.substring(0, 200)}...
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Status Display */}
        {status !== 'idle' && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center gap-2">
              {status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {status === 'processing' && <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
              {status === 'complete' && <CheckCircle2 className="h-4 w-4 text-success" />}
              {status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
              <span className={cn(
                'text-sm font-medium',
                status === 'error' && 'text-destructive',
                status === 'complete' && 'text-success'
              )}>
                {getStatusMessage()}
              </span>
            </div>
            {(status === 'uploading' || status === 'processing') && (
              <Progress value={progress} className="h-2" />
            )}
          </div>
        )}

        {/* AI Extraction Preview */}
        {transcript && status === 'idle' && (
          <div className="mt-4 p-4 rounded-lg border border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI will extract:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Decisions</Badge>
              <Badge variant="secondary">Action Items</Badge>
              <Badge variant="secondary">Risks</Badge>
              <Badge variant="secondary">Key Topics</Badge>
              <Badge variant="secondary">Sentiment Analysis</Badge>
              <Badge variant="secondary">Scope Changes</Badge>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadAndProcess}
            disabled={!transcript.trim() || status === 'uploading' || status === 'processing'}
          >
            {status === 'uploading' || status === 'processing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Process with AI
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
