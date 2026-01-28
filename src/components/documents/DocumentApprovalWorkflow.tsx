import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Send,
  MessageSquare,
  ChevronRight,
  FileCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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

interface Approver {
  id: string;
  name: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  date?: string;
  comment?: string;
  order: number;
}

interface ApprovalWorkflowProps {
  documentId: string;
  documentName: string;
  currentStatus: 'draft' | 'pending-review' | 'in-review' | 'approved' | 'rejected';
  approvers: Approver[];
  currentUserCanApprove?: boolean;
  onSubmitForReview?: () => void;
  onApprove?: (comment?: string) => void;
  onReject?: (comment: string) => void;
  onRequestChanges?: (comment: string) => void;
}

export function DocumentApprovalWorkflow({
  documentId,
  documentName,
  currentStatus,
  approvers,
  currentUserCanApprove = false,
  onSubmitForReview,
  onApprove,
  onReject,
  onRequestChanges,
}: ApprovalWorkflowProps) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'request-changes'>('approve');
  const [approvalComment, setApprovalComment] = useState('');

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'pending-review':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'in-review':
        return <Badge variant="info">In Review</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  const getApproverStatusIcon = (status: Approver['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'skipped':
        return <ChevronRight className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleAction = () => {
    switch (approvalAction) {
      case 'approve':
        onApprove?.(approvalComment || undefined);
        break;
      case 'reject':
        if (approvalComment) onReject?.(approvalComment);
        break;
      case 'request-changes':
        if (approvalComment) onRequestChanges?.(approvalComment);
        break;
    }
    setShowApprovalDialog(false);
    setApprovalComment('');
  };

  const pendingApprovers = approvers.filter(a => a.status === 'pending');
  const completedApprovers = approvers.filter(a => a.status !== 'pending');
  const progress = (completedApprovers.length / approvers.length) * 100;

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">Approval Workflow</h3>
            <p className="text-xs text-muted-foreground">{documentName}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Progress */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {completedApprovers.length} of {approvers.length} approvals
          </span>
          <span className="text-xs font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={cn(
              "h-full rounded-full",
              currentStatus === 'rejected' ? 'bg-destructive' : 'bg-primary'
            )}
          />
        </div>
      </div>

      {/* Approvers List */}
      <div className="divide-y">
        {approvers.sort((a, b) => a.order - b.order).map((approver, index) => (
          <div
            key={approver.id}
            className={cn(
              "p-4 flex items-start gap-3",
              approver.status === 'pending' && index === completedApprovers.length && "bg-primary/5"
            )}
          >
            {/* Step Number / Status */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2",
                  approver.status === 'approved' && "border-success bg-success/20 text-success",
                  approver.status === 'rejected' && "border-destructive bg-destructive/20 text-destructive",
                  approver.status === 'pending' && index === completedApprovers.length && "border-primary bg-primary/20 text-primary",
                  approver.status === 'pending' && index !== completedApprovers.length && "border-muted-foreground/30 text-muted-foreground",
                  approver.status === 'skipped' && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {approver.status === 'pending' ? (
                  index + 1
                ) : (
                  getApproverStatusIcon(approver.status)
                )}
              </div>
              {index < approvers.length - 1 && (
                <div className="w-0.5 h-4 bg-border mt-2" />
              )}
            </div>

            {/* Approver Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">
                    {approver.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{approver.name}</span>
                <Badge variant="outline" className="text-[10px]">{approver.role}</Badge>
              </div>
              
              {approver.date && (
                <p className="text-xs text-muted-foreground mt-1">
                  {approver.status === 'approved' ? 'Approved' : 'Rejected'} on {approver.date}
                </p>
              )}
              
              {approver.comment && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-sm flex items-start gap-2">
                  <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{approver.comment}</span>
                </div>
              )}

              {approver.status === 'pending' && index === completedApprovers.length && (
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Awaiting decision
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-4 border-t bg-muted/30">
        {currentStatus === 'draft' && (
          <Button className="w-full" onClick={onSubmitForReview}>
            <Send className="h-4 w-4 mr-2" />
            Submit for Review
          </Button>
        )}
        
        {currentUserCanApprove && (currentStatus === 'pending-review' || currentStatus === 'in-review') && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => {
                setApprovalAction('reject');
                setShowApprovalDialog(true);
              }}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setApprovalAction('request-changes');
                setShowApprovalDialog(true);
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Request Changes
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setApprovalAction('approve');
                setShowApprovalDialog(true);
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        )}

        {currentStatus === 'rejected' && (
          <div className="text-center">
            <p className="text-sm text-destructive mb-2 flex items-center justify-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Document was rejected
            </p>
            <Button variant="outline" size="sm">
              Upload Revised Version
            </Button>
          </div>
        )}

        {currentStatus === 'approved' && (
          <div className="text-center text-success flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">All approvals complete</span>
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === 'approve' && <CheckCircle2 className="h-5 w-5 text-success" />}
              {approvalAction === 'reject' && <XCircle className="h-5 w-5 text-destructive" />}
              {approvalAction === 'request-changes' && <RotateCcw className="h-5 w-5 text-warning" />}
              {approvalAction === 'approve' && 'Approve Document'}
              {approvalAction === 'reject' && 'Reject Document'}
              {approvalAction === 'request-changes' && 'Request Changes'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' && 'Add an optional comment with your approval.'}
              {approvalAction === 'reject' && 'Please provide a reason for rejection.'}
              {approvalAction === 'request-changes' && 'Describe the changes needed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={
                approvalAction === 'approve'
                  ? 'Add a comment (optional)...'
                  : 'Provide detailed feedback...'
              }
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={approvalAction === 'reject' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={
                (approvalAction === 'reject' || approvalAction === 'request-changes') && 
                !approvalComment.trim()
              }
            >
              {approvalAction === 'approve' && 'Approve'}
              {approvalAction === 'reject' && 'Reject'}
              {approvalAction === 'request-changes' && 'Request Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
