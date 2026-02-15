/**
 * ExportDialog Component
 * Unified export interface for analytics dashboards
 */

import React, { useState, useRef } from 'react';
import { Download, Mail, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { chartExporter } from '@/utils/chartExporter';
import { exportService } from '@/services/exportService';
import type { ExportOptions, ExportProgress } from '@/types/export';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dashboardTitle: string;
    data: any[];
    containerRef?: React.RefObject<HTMLElement>;
}

export function ExportDialog({
    open,
    onOpenChange,
    dashboardTitle,
    data,
    containerRef
}: ExportDialogProps) {
    const { toast } = useToast();
    const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
    const [includeCharts, setIncludeCharts] = useState(true);
    const [includeData, setIncludeData] = useState(true);
    const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'email'>('download');
    const [emailRecipients, setEmailRecipients] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState<ExportProgress | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        setProgress({ stage: 'preparing', progress: 0, message: 'Preparing export...' });

        try {
            let blob: Blob;
            const filename = `${dashboardTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

            // Export charts if needed
            let charts: { title: string; image: string }[] = [];
            if (includeCharts && containerRef?.current) {
                setProgress({ stage: 'exporting-charts', progress: 20, message: 'Exporting charts...' });
                const chartData = await chartExporter.exportAllChartsInContainer(containerRef.current);
                charts = chartData.map((c, i) => ({
                    title: `Chart ${i + 1}`,
                    image: c.image
                }));
            }

            setProgress({ stage: 'generating-file', progress: 50, message: 'Generating file...' });

            // Generate file based on format
            if (format === 'pdf') {
                blob = await exportService.exportToPDF(
                    includeData ? data : [],
                    charts,
                    {
                        format: 'pdf',
                        title: dashboardTitle,
                        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
                        includeCharts,
                        includeData,
                        orientation: 'portrait',
                        pageSize: 'a4',
                        footerText: `Page {pageNumber} of {totalPages}`
                    }
                );
            } else if (format === 'excel') {
                blob = await exportService.exportToExcel(
                    [
                        {
                            name: 'Data',
                            data: includeData ? data : [],
                            charts: includeCharts ? charts : undefined
                        }
                    ],
                    {
                        format: 'excel',
                        includeCharts,
                        includeData,
                        autoFilter: true,
                        freezeHeader: true
                    }
                );
            } else {
                blob = await exportService.exportToCSV(data, {
                    format: 'csv',
                    includeHeaders: true
                });
            }

            setProgress({ stage: 'complete', progress: 90, message: 'Finalizing...' });

            // Deliver file
            if (deliveryMethod === 'download') {
                const extension = format === 'excel' ? 'xlsx' : format;
                exportService.downloadFile(blob, `${filename}.${extension}`);

                toast({
                    title: 'Export successful',
                    description: `Your ${format.toUpperCase()} file has been downloaded.`
                });
            } else {
                setProgress({ stage: 'sending-email', progress: 95, message: 'Sending email...' });
                const recipients = emailRecipients.split(',').map(e => e.trim()).filter(Boolean);

                try {
                    await exportService.emailReport(
                        blob,
                        recipients,
                        `${dashboardTitle} - Analytics Report`
                    );

                    toast({
                        title: 'Email sent',
                        description: `Report sent to ${recipients.length} recipient(s).`
                    });
                } catch (error) {
                    toast({
                        title: 'Email delivery not available',
                        description: 'Downloading file instead.',
                        variant: 'destructive'
                    });
                    const extension = format === 'excel' ? 'xlsx' : format;
                    exportService.downloadFile(blob, `${filename}.${extension}`);
                }
            }

            setProgress({ stage: 'complete', progress: 100, message: 'Complete!' });
            setTimeout(() => {
                onOpenChange(false);
                setProgress(null);
            }, 1000);

        } catch (error) {
            console.error('Export failed:', error);
            toast({
                title: 'Export failed',
                description: error instanceof Error ? error.message : 'An error occurred during export.',
                variant: 'destructive'
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Export Analytics Report</DialogTitle>
                    <DialogDescription>
                        Choose your export format and delivery method.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Format Selection */}
                    <div className="space-y-3">
                        <Label>Export Format</Label>
                        <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pdf" id="pdf" />
                                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                                    <FileText className="h-4 w-4" />
                                    PDF Document
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="excel" id="excel" />
                                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Excel Spreadsheet
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="csv" id="csv" />
                                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                                    <FileType className="h-4 w-4" />
                                    CSV File
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <Label>Include</Label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="charts"
                                    checked={includeCharts}
                                    onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                                    disabled={format === 'csv'}
                                />
                                <Label htmlFor="charts" className="cursor-pointer">
                                    Include charts
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="data"
                                    checked={includeData}
                                    onCheckedChange={(checked) => setIncludeData(checked as boolean)}
                                />
                                <Label htmlFor="data" className="cursor-pointer">
                                    Include data tables
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Method */}
                    <div className="space-y-3">
                        <Label>Delivery Method</Label>
                        <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="download" id="download" />
                                <Label htmlFor="download" className="flex items-center gap-2 cursor-pointer">
                                    <Download className="h-4 w-4" />
                                    Download
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="email" id="email" />
                                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </Label>
                            </div>
                        </RadioGroup>

                        {deliveryMethod === 'email' && (
                            <Input
                                placeholder="email@example.com, another@example.com"
                                value={emailRecipients}
                                onChange={(e) => setEmailRecipients(e.target.value)}
                            />
                        )}
                    </div>

                    {/* Progress */}
                    {progress && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>{progress.message}</span>
                                <span>{progress.progress}%</span>
                            </div>
                            <Progress value={progress.progress} />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting || (deliveryMethod === 'email' && !emailRecipients)}>
                        {isExporting ? 'Exporting...' : 'Export Report'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
