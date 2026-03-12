import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, X } from 'lucide-react';
import { SharingService, type SharePermission } from '@/services/sharingService';
import type { SpreadsheetShare } from '@/services/sharingService';

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spreadsheetId: string;
    spreadsheetName: string;
}

export function ShareDialog({ open, onOpenChange, spreadsheetId, spreadsheetName }: ShareDialogProps) {
    const [shares, setShares] = useState<SpreadsheetShare[]>([]);
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<SharePermission>('view');
    const [loading, setLoading] = useState(false);

    // Load shares when dialog opens
    React.useEffect(() => {
        if (open) {
            loadShares();
        }
    }, [open, spreadsheetId]);

    const loadShares = async () => {
        const shares = await SharingService.getShares(spreadsheetId);
        setShares(shares);
    };

    const handleShare = async () => {
        if (!email.trim()) return;

        setLoading(true);
        const share = await SharingService.createShare({
            spreadsheet_id: spreadsheetId,
            shared_with_email: email.trim(),
            permission,
        });

        if (share) {
            setShares([share, ...shares]);
            setEmail('');
            setPermission('view');
        }
        setLoading(false);
    };

    const handleUpdatePermission = async (shareId: string, newPermission: SharePermission) => {
        const success = await SharingService.updateSharePermission(shareId, newPermission);
        if (success) {
            setShares(shares.map(s => s.id === shareId ? { ...s, permission: newPermission } : s));
        }
    };

    const handleRemoveShare = async (shareId: string) => {
        const success = await SharingService.deleteShare(shareId);
        if (success) {
            setShares(shares.filter(s => s.id !== shareId));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Share "{spreadsheetName}"</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Add new share */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                type="email"
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                            />
                        </div>
                        <Select value={permission} onValueChange={(v) => setPermission(v as SharePermission)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="view">View</SelectItem>
                                <SelectItem value="edit">Edit</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleShare} disabled={loading || !email.trim()}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                        </Button>
                    </div>

                    {/* Existing shares */}
                    <div className="space-y-2">
                        <Label>People with access</Label>
                        {shares.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No one else has access yet
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {shares.map((share) => (
                                    <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">
                                                {share.shared_with_email || share.user_email || 'Unknown user'}
                                            </p>
                                            {share.expires_at && (
                                                <p className="text-xs text-muted-foreground">
                                                    Expires {new Date(share.expires_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={share.permission}
                                                onValueChange={(v) => handleUpdatePermission(share.id, v as SharePermission)}
                                            >
                                                <SelectTrigger className="w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="view">View</SelectItem>
                                                    <SelectItem value="edit">Edit</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveShare(share.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
