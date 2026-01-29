import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  Image,
  Link,
  Smile,
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { EmailAccount } from '@/hooks/useEmailAccounts';
import { Email } from '@/hooks/useEmails';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'new' | 'reply' | 'forward';
  replyToEmail?: Email;
  accounts: EmailAccount[];
}

export function EmailComposeDialog({
  open,
  onOpenChange,
  mode,
  replyToEmail,
  accounts,
}: EmailComposeDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Initialize form based on mode
  useEffect(() => {
    if (!open) return;

    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }

    if (mode === 'reply' && replyToEmail) {
      setTo(replyToEmail.from_address);
      setSubject(`Re: ${replyToEmail.subject || ''}`);
      setBody(`\n\n---\nOn ${new Date(replyToEmail.received_at).toLocaleString()}, ${replyToEmail.from_name || replyToEmail.from_address} wrote:\n\n${replyToEmail.body_text || ''}`);
    } else if (mode === 'forward' && replyToEmail) {
      setTo('');
      setSubject(`Fwd: ${replyToEmail.subject || ''}`);
      setBody(`\n\n---\nForwarded message:\nFrom: ${replyToEmail.from_address}\nDate: ${new Date(replyToEmail.received_at).toLocaleString()}\nSubject: ${replyToEmail.subject}\n\n${replyToEmail.body_text || ''}`);
    } else {
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
    }
  }, [open, mode, replyToEmail, accounts, selectedAccountId]);

  const handleSend = async () => {
    if (!selectedAccountId || !to) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSending(true);

    try {
      const response = await supabase.functions.invoke('email-send', {
        body: {
          accountId: selectedAccountId,
          to: to.split(',').map((e) => e.trim()),
          cc: cc ? cc.split(',').map((e) => e.trim()) : [],
          bcc: bcc ? bcc.split(',').map((e) => e.trim()) : [],
          subject,
          body,
          replyToMessageId: mode === 'reply' ? replyToEmail?.message_id : undefined,
        },
      });

      if (response.error) throw response.error;

      toast.success('Email sent successfully');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error sending email:', err);
      toast.error(err.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleDiscard = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    onOpenChange(false);
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 right-4 w-72 bg-card border rounded-t-lg shadow-lg z-50"
      >
        <div
          className="flex items-center justify-between px-3 py-2 border-b cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <span className="font-medium text-sm truncate">
            {subject || 'New Message'}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
              e.stopPropagation();
              handleDiscard();
            }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <h3 className="font-semibold">
            {mode === 'reply' ? 'Reply' : mode === 'forward' ? 'Forward' : 'New Message'}
          </h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(true)}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 space-y-3">
          {/* From Account */}
          {accounts.length > 1 && (
            <div className="flex items-center gap-2">
              <Label className="w-12 text-right text-muted-foreground text-sm">From</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.display_name || account.email_address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* To */}
          <div className="flex items-center gap-2">
            <Label className="w-12 text-right text-muted-foreground text-sm">To</Label>
            <Input
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setShowCcBcc(!showCcBcc)}
            >
              Cc/Bcc
            </Button>
          </div>

          {/* Cc/Bcc */}
          {showCcBcc && (
            <>
              <div className="flex items-center gap-2">
                <Label className="w-12 text-right text-muted-foreground text-sm">Cc</Label>
                <Input
                  placeholder="cc@example.com"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-12 text-right text-muted-foreground text-sm">Bcc</Label>
                <Input
                  placeholder="bcc@example.com"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  className="flex-1"
                />
              </div>
            </>
          )}

          {/* Subject */}
          <div className="flex items-center gap-2">
            <Label className="w-12 text-right text-muted-foreground text-sm">Subject</Label>
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Rich Text Toolbar */}
        <div className="flex items-center gap-1 px-4 py-2 border-t border-b">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Link className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Image className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-4 py-2">
          <Textarea
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[200px] resize-none border-0 focus-visible:ring-0 p-0"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
          <div className="flex items-center gap-2">
            <Button onClick={handleSend} disabled={isSending || !to}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Send'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Schedule send</DropdownMenuItem>
                <DropdownMenuItem>Save as draft</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Smile className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDiscard}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
