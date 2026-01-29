import React, { useState } from 'react';
import { Share2, Link, Copy, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type DocumentShare } from '@/hooks/useDocumentSharing';

interface DocumentShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  shares: DocumentShare[];
  onShareWithEmail: (email: string, permission: 'view' | 'comment' | 'edit') => Promise<unknown>;
  onGenerateLink: (permission: 'view' | 'comment' | 'edit') => Promise<string | null>;
  onRemoveShare: (shareId: string) => Promise<unknown>;
  onUpdatePermission: (shareId: string, permission: 'view' | 'comment' | 'edit') => Promise<unknown>;
  onCopyLink: (link: string) => void;
}

export function DocumentShareDialog({
  open,
  onOpenChange,
  documentName,
  shares,
  onShareWithEmail,
  onGenerateLink,
  onRemoveShare,
  onUpdatePermission,
  onCopyLink,
}: DocumentShareDialogProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [isSharing, setIsSharing] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleShare = async () => {
    if (!email.trim()) return;

    setIsSharing(true);
    try {
      await onShareWithEmail(email.trim(), permission);
      setEmail('');
    } finally {
      setIsSharing(false);
    }
  };

  const handleGenerateLink = async () => {
    const link = await onGenerateLink(permission);
    if (link) {
      setGeneratedLink(link);
    }
  };

  const emailShares = shares.filter((s) => s.shared_with_email);
  const linkShares = shares.filter((s) => s.share_link);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Share "{documentName}" with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share with email */}
          <div className="space-y-3">
            <Label>Share with people</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Select
                value={permission}
                onValueChange={(v) => setPermission(v as any)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleShare} disabled={!email.trim() || isSharing}>
                <Mail className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Current shares */}
          {emailShares.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">People with access</Label>
              <div className="space-y-2">
                {emailShares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{share.shared_with_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={share.permission}
                        onValueChange={(v) =>
                          onUpdatePermission(share.id, v as any)
                        }
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="comment">Comment</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="iconXs"
                        onClick={() => onRemoveShare(share.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Generate link */}
          <div className="space-y-3">
            <Label>Get shareable link</Label>
            <div className="flex gap-2">
              <Select
                value={permission}
                onValueChange={(v) => setPermission(v as any)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleGenerateLink} className="flex-1">
                <Link className="h-4 w-4 mr-1" />
                Generate Link
              </Button>
            </div>

            {generatedLink && (
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                <Input
                  value={generatedLink}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyLink(generatedLink)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Active links */}
          {linkShares.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Active links</Label>
              <div className="space-y-2">
                {linkShares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {share.share_link}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {share.permission}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="iconXs"
                        onClick={() => onCopyLink(share.share_link!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconXs"
                        onClick={() => onRemoveShare(share.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
