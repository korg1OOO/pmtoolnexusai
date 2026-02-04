import { useState } from 'react';
import { usePortfolios, useCreatePortfolio, useUpdatePortfolio, useDeletePortfolio } from '@/hooks/usePortfolios';
import { usePrograms, useCreateProgram, useUpdateProgram, useDeleteProgram } from '@/hooks/usePrograms';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, FolderKanban, MoreHorizontal, Plus, Trash2, Edit } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function PortfolioManagement() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Management</CardTitle>
                <CardDescription>Manage your Portfolios and Programs structure.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="portfolios" className="w-full">
                    <TabsList>
                        <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
                        <TabsTrigger value="programs">Programs</TabsTrigger>
                    </TabsList>
                    <TabsContent value="portfolios">
                        <PortfoliosManager />
                    </TabsContent>
                    <TabsContent value="programs">
                        <ProgramsManager />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

function PortfoliosManager() {
    const { data: portfolios } = usePortfolios();
    const createPortfolio = useCreatePortfolio();
    const updatePortfolio = useUpdatePortfolio();
    const deletePortfolio = useDeletePortfolio();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        try {
            await createPortfolio.mutateAsync({ name, description, status: 'active' });
            toast.success('Portfolio created');
            setIsCreateOpen(false);
            form.reset();
        } catch (error) {
            toast.error('Failed to create portfolio');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const status = formData.get('status') as 'active' | 'archived';

        try {
            await updatePortfolio.mutateAsync({ id: editingItem.id, name, description, status });
            toast.success('Portfolio updated');
            setEditingItem(null);
        } catch (error) {
            toast.error('Failed to update portfolio');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) return;
        try {
            await deletePortfolio.mutateAsync(id);
            toast.success('Portfolio deleted');
        } catch (error) {
            toast.error('Failed to delete portfolio');
        }
    };

    return (
        <div className="space-y-4 pt-4">
            <div className="flex justify-end">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Portfolio</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Portfolio</DialogTitle>
                            <DialogDescription>Add a new portfolio to organize your programs.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Description</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolios?.map((portfolio) => (
                            <tr key={portfolio.id} className="border-t">
                                <td className="p-4 font-medium flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                    {portfolio.name}
                                </td>
                                <td className="p-4 text-muted-foreground">{portfolio.description}</td>
                                <td className="p-4">
                                    <Badge variant={portfolio.status === 'active' ? 'default' : 'secondary'}>
                                        {portfolio.status}
                                    </Badge>
                                </td>
                                <td className="p-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingItem(portfolio)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(portfolio.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                        {(!portfolios || portfolios.length === 0) && (
                            <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No portfolios found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Portfolio</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input id="edit-name" name="name" defaultValue={editingItem.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea id="edit-description" name="description" defaultValue={editingItem.description} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select name="status" defaultValue={editingItem.status}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Update</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ProgramsManager() {
    const { data: portfolios } = usePortfolios();
    const { data: programs } = usePrograms();
    const createProgram = useCreateProgram();
    const updateProgram = useUpdateProgram();
    const deleteProgram = useDeleteProgram();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const portfolioId = formData.get('portfolio_id') as string;

        try {
            await createProgram.mutateAsync({ name, description, portfolio_id: portfolioId, status: 'active' });
            toast.success('Program created');
            setIsCreateOpen(false);
            form.reset();
        } catch (error) {
            toast.error('Failed to create program');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const status = formData.get('status') as 'active' | 'archived';

        try {
            await updateProgram.mutateAsync({ id: editingItem.id, name, description, status });
            toast.success('Program updated');
            setEditingItem(null);
        } catch (error) {
            toast.error('Failed to update program');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this program? This action cannot be undone.')) return;
        try {
            await deleteProgram.mutateAsync(id);
            toast.success('Program deleted');
        } catch (error) {
            toast.error('Failed to delete program');
        }
    };

    const getPortfolioName = (id: string) => portfolios?.find(p => p.id === id)?.name || 'Unknown';

    return (
        <div className="space-y-4 pt-4">
            <div className="flex justify-end">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Program</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Program</DialogTitle>
                            <DialogDescription>Add a new program to a portfolio.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="portfolio_id">Portfolio</Label>
                                <Select name="portfolio_id" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a portfolio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {portfolios?.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Portfolio</th>
                            <th className="p-4 font-medium">Description</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {programs?.map((program) => (
                            <tr key={program.id} className="border-t">
                                <td className="p-4 font-medium flex items-center gap-2">
                                    <FolderKanban className="h-4 w-4 text-blue-500" />
                                    {program.name}
                                </td>
                                <td className="p-4 text-muted-foreground">{getPortfolioName(program.portfolio_id)}</td>
                                <td className="p-4 text-muted-foreground truncate max-w-[200px]">{program.description}</td>
                                <td className="p-4">
                                    <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                                        {program.status}
                                    </Badge>
                                </td>
                                <td className="p-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingItem(program)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(program.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                        {(!programs || programs.length === 0) && (
                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No programs found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Program</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input id="edit-name" name="name" defaultValue={editingItem.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea id="edit-description" name="description" defaultValue={editingItem.description} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select name="status" defaultValue={editingItem.status}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Update</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
