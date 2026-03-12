import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, DollarSign, TrendingUp, Code, CheckCircle, XCircle, Clock } from "lucide-react";
import {
    useReferralCodes,
    useReferralConversions,
    useAffiliatePayouts,
    usePendingPayouts,
    usePayoutStats,
    useConversionStats,
    useGenerateReferralCode,
    useDeactivateReferralCode,
    useApprovePayout,
    useRejectPayout
} from "@/hooks/useAffiliates";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function AdminAffiliates() {
    const { toast } = useToast();
    const [selectedTab, setSelectedTab] = useState("overview");
    const [newCodeUserId, setNewCodeUserId] = useState("");
    const [newCodeRate, setNewCodeRate] = useState("10");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

    // Fetch data
    const { data: codes = [] } = useReferralCodes();
    const { data: conversions = [] } = useReferralConversions();
    const { data: payouts = [] } = useAffiliatePayouts();
    const { data: pendingPayouts = [] } = usePendingPayouts();
    const { data: payoutStats } = usePayoutStats();
    const { data: conversionStats } = useConversionStats();

    // Mutations
    const generateCode = useGenerateReferralCode();
    const deactivateCode = useDeactivateReferralCode();
    const approvePayout = useApprovePayout();
    const rejectPayout = useRejectPayout();

    const handleGenerateCode = () => {
        if (!newCodeUserId) {
            toast({ title: "Error", description: "User ID is required", variant: "destructive" });
            return;
        }

        generateCode.mutate({
            userId: newCodeUserId,
            commissionRate: parseFloat(newCodeRate) / 100,
        }, {
            onSuccess: (data) => {
                toast({ title: "Success", description: `Generated code: ${data.code}` });
                setIsDialogOpen(false);
                setNewCodeUserId("");
                setNewCodeRate("10");
            },
            onError: () => {
                toast({ title: "Error", description: "Failed to generate code", variant: "destructive" });
            },
        });
    };

    const handleDeactivateCode = (id: string) => {
        deactivateCode.mutate(id, {
            onSuccess: () => {
                toast({ title: "Success", description: "Code deactivated" });
            },
        });
    };

    const handleApprovePayout = (id: string) => {
        approvePayout.mutate({ id, approvedBy: "admin" }, {
            onSuccess: () => {
                toast({ title: "Success", description: "Payout approved" });
            },
        });
    };

    const handleRejectPayout = () => {
        if (!selectedPayoutId || !rejectReason) return;

        rejectPayout.mutate(
            { id: selectedPayoutId, reason: rejectReason },
            {
                onSuccess: () => {
                    toast({ title: "Success", description: "Payout rejected" });
                    setSelectedPayoutId(null);
                    setRejectReason("");
                },
            }
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Users className="h-8 w-8 text-purple-600" />
                    Affiliate Management
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage referral codes, track conversions, and process payouts
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Codes</p>
                            <p className="text-3xl font-bold mt-2">{codes.filter(c => c.status === 'active').length}</p>
                        </div>
                        <Code className="h-10 w-10 text-blue-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Conversions</p>
                            <p className="text-3xl font-bold mt-2">{conversionStats?.total || 0}</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {conversionStats?.last30d || 0} in last 30 days
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pending Payouts</p>
                            <p className="text-3xl font-bold mt-2">{payoutStats?.pending || 0}</p>
                        </div>
                        <Clock className="h-10 w-10 text-yellow-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        ${(payoutStats?.totalPending || 0).toFixed(2)} pending
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                            <p className="text-3xl font-bold mt-2">${(payoutStats?.totalPaid || 0).toFixed(2)}</p>
                        </div>
                        <DollarSign className="h-10 w-10 text-purple-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {payoutStats?.paid || 0} payouts completed
                    </p>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="codes">Referral Codes</TabsTrigger>
                    <TabsTrigger value="conversions">Conversions</TabsTrigger>
                    <TabsTrigger value="payouts">Payouts</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Pending Payouts Queue</h3>
                        {pendingPayouts.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingPayouts.slice(0, 5).map((payout) => (
                                        <TableRow key={payout.id}>
                                            <TableCell className="font-mono text-xs">{payout.user_id}</TableCell>
                                            <TableCell className="font-bold">${payout.amount.toFixed(2)}</TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleApprovePayout(payout.id)}>
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setSelectedPayoutId(payout.id)}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No pending payouts</p>
                        )}
                    </Card>
                </TabsContent>

                {/* Referral Codes Tab */}
                <TabsContent value="codes" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Referral Codes</h3>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Code className="mr-2 h-4 w-4" />
                                    Generate Code
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Generate Referral Code</DialogTitle>
                                    <DialogDescription>Create a new referral code for a user</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="userId">User ID</Label>
                                        <Input
                                            id="userId"
                                            value={newCodeUserId}
                                            onChange={(e) => setNewCodeUserId(e.target.value)}
                                            placeholder="user-uuid-here"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                                        <Input
                                            id="commissionRate"
                                            type="number"
                                            value={newCodeRate}
                                            onChange={(e) => setNewCodeRate(e.target.value)}
                                            placeholder="10"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleGenerateCode} disabled={generateCode.isPending}>
                                        Generate
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Commission %</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {codes.map((code) => (
                                    <TableRow key={code.id}>
                                        <TableCell className="font-mono font-bold">{code.code}</TableCell>
                                        <TableCell className="font-mono text-xs">{code.user_id}</TableCell>
                                        <TableCell>{(code.commission_rate * 100).toFixed(1)}%</TableCell>
                                        <TableCell>
                                            <Badge variant={code.status === 'active' ? 'default' : 'secondary'}>
                                                {code.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(code.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            {code.status === 'active' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeactivateCode(code.id)}
                                                >
                                                    Deactivate
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Conversions Tab */}
                <TabsContent value="conversions" className="space-y-4">
                    <h3 className="text-lg font-semibold">Conversion Tracking</h3>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Referred User</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Converted At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {conversions.slice(0, 20).map((conversion) => (
                                    <TableRow key={conversion.id}>
                                        <TableCell className="font-mono text-xs">{conversion.referred_user_id}</TableCell>
                                        <TableCell className="font-bold">${conversion.conversion_value.toFixed(2)}</TableCell>
                                        <TableCell>{conversion.conversion_type}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                conversion.status === 'paid' ? 'default' :
                                                    conversion.status === 'approved' ? 'secondary' :
                                                        'outline'
                                            }>
                                                {conversion.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(conversion.converted_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Payouts Tab */}
                <TabsContent value="payouts" className="space-y-4">
                    <h3 className="text-lg font-semibold">Payout History</h3>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell className="font-mono text-xs">{payout.user_id}</TableCell>
                                        <TableCell className="font-bold">${payout.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                payout.status === 'paid' ? 'default' :
                                                    payout.status === 'approved' ? 'secondary' :
                                                        payout.status === 'rejected' ? 'destructive' :
                                                            'outline'
                                            }>
                                                {payout.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{new Date(payout.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Reject Dialog */}
            <Dialog open={!!selectedPayoutId} onOpenChange={() => setSelectedPayoutId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payout</DialogTitle>
                        <DialogDescription>Provide a reason for rejecting this payout</DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label htmlFor="reason">Rejection Reason</Label>
                        <Input
                            id="reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedPayoutId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRejectPayout}>Reject Payout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AdminAffiliates;
