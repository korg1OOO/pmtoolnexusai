import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentPreviewProps {
    documentUrl: string;
    documentType: 'pdf' | 'image' | 'text' | 'excel' | 'word' | 'unknown';
    title: string;
    isOpen: boolean;
    onClose: () => void;
}

export function DocumentPreview({
    documentUrl,
    documentType,
    title,
    isOpen,
    onClose,
}: DocumentPreviewProps) {
    const handleDownload = () => {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderPreview = () => {
        switch (documentType) {
            case 'pdf':
                return (
                    <iframe
                        src={documentUrl}
                        className="w-full h-full border-0"
                        title={title}
                    />
                );

            case 'image':
                return (
                    <div className="flex items-center justify-center h-full bg-muted/20">
                        <img
                            src={documentUrl}
                            alt={title}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                );

            case 'text':
                return (
                    <iframe
                        src={documentUrl}
                        className="w-full h-full border-0 bg-white"
                        title={title}
                    />
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="text-muted-foreground mb-4">
                            <p className="text-lg font-medium mb-2">Preview not available</p>
                            <p className="text-sm">
                                This file type cannot be previewed in the browser.
                            </p>
                            <p className="text-sm">Please download the file to view it.</p>
                        </div>
                        <Button onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download File
                        </Button>
                    </div>
                );
        }
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50"
                    onClick={onClose}
                />
            )}

            {/* Preview Modal */}
            <div
                className={cn(
                    'fixed inset-4 md:inset-8 bg-background border shadow-lg z-50 rounded-lg flex flex-col transition-transform duration-300',
                    isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex-1 mr-4">
                        <h2 className="text-lg font-semibold truncate">{title}</h2>
                        <p className="text-sm text-muted-foreground capitalize">{documentType} Document</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-hidden">
                    {renderPreview()}
                </div>
            </div>
        </>
    );
}
