import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Plus } from 'lucide-react';
import { useCreateBudgetItem } from '@/hooks/useFinancials';
import { useProjectContext } from '@/contexts/ProjectContext';

const formSchema = z.object({
    category: z.enum([
        'Personnel',
        'Contractors',
        'Infrastructure',
        'Software',
        'Training',
        'Contingency',
        'Travel',
        'Other',
    ]),
    planned: z.coerce.number(),
    actual: z.coerce.number().optional(),
    forecast: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddBudgetItemDialog({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const { settings } = useProjectContext();
    const createBudgetItem = useCreateBudgetItem();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: 'Personnel',
            planned: 0,
            actual: 0,
            forecast: 0,
        },
    });

    const onSubmit = async (values: FormValues) => {
        if (!settings.id) return;

        try {
            await createBudgetItem.mutateAsync({
                project_id: settings.id,
                ...values,
            });
            setOpen(false);
            form.reset();
        } catch (error) {
            console.error('Failed to create budget item:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Budget Item</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Personnel">Personnel</SelectItem>
                                            <SelectItem value="Contractors">Contractors</SelectItem>
                                            <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                                            <SelectItem value="Software">Software</SelectItem>
                                            <SelectItem value="Training">Training</SelectItem>
                                            <SelectItem value="Contingency">Contingency</SelectItem>
                                            <SelectItem value="Travel">Travel</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="planned"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Planned Budget ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="forecast"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Forecast ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="actual"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Actual Spend (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createBudgetItem.isPending}>
                                {createBudgetItem.isPending ? 'Creating...' : 'Create Item'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
