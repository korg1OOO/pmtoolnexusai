/**
 * Admin Media Library
 * Centralized media management with file uploads and metadata editor
 */

import React, { useState } from 'react';
import {
    Plus,
    Search,
    Trash2,
    Image as ImageIcon,
    File,
    Video,
    Music,
    MoreHorizontal,
    Copy,
    Download,
    Info,
    Upload,
    X,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    useMediaLibrary,
    useUploadMedia,
    useUpdateMedia,
    useDeleteMedia,
    MediaFile
} from '@/hooks/useContentManagement';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function AdminMedia() {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

    // Fetch data
    const { data: media = [], isLoading } = useMediaLibrary();
    const uploadMedia = useUploadMedia();
    const updateMedia = useUpdateMedia();
    const deleteMedia = useDeleteMedia();

    // Filter media
    const filteredMedia = media.filter(file => {
        if (typeFilter !== 'all' && file.file_type !== typeFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                file.original_filename.toLowerCase().includes(query) ||
                file.alt_text?.toLowerCase().includes(query) ||
                file.caption?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large (max 10MB)');
            return;
        }

        try {
            await uploadMedia.mutateAsync(file);
            setIsUploadDialogOpen(false);
        } catch (error) {
            // Error handled by hook
        }
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success('URL copied to clipboard');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Media Library</h1>
                    <p className="text-muted-foreground">
                        Manage images, videos, and documents for your content
                    </p>
                </div>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Media
                </Button>
            </div>

            {/* Toolbar */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by filename or alt text..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Badge variant={typeFilter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setTypeFilter('all')}>All</Badge>
                        <Badge variant={typeFilter === 'image' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setTypeFilter('image')}>Images</Badge>
                        <Badge variant={typeFilter === 'video' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setTypeFilter('video')}>Videos</Badge>
                        <Badge variant={typeFilter === 'application' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setTypeFilter('application')}>Docs</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Media Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-square bg-slate-100 animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : filteredMedia.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <CardContent className="space-y-4">
                        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <Filter className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-lg font-medium">No media found</p>
                            <p className="text-muted-foreground">Try adjusting your search or upload new files.</p>
                        </div>
                        <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>Upload First File</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredMedia.map(file => (
                        <MediaCard
                            key={file.id}
                            file={file}
                            onSelect={setSelectedFile}
                            onCopy={copyUrl}
                            onDelete={(id) => {
                                if (confirm('Permanently delete this file?')) {
                                    deleteMedia.mutate(id);
                                }
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Media</DialogTitle>
                        <DialogDescription>
                            Choose a file to upload to the library. Max size 10MB.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-12 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 bg-slate-50/50">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Drag and drop or click to upload</p>
                            <p className="text-xs text-muted-foreground text-center">Images, Videos, PDFs supported</p>
                        </div>
                        <Input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleUpload}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            {selectedFile && (
                <DetailsDialog
                    file={selectedFile}
                    open={!!selectedFile}
                    onOpenChange={(open) => !open && setSelectedFile(null)}
                    onSave={(updates) => {
                        updateMedia.mutate({ id: selectedFile.id, updates }, {
                            onSuccess: () => setSelectedFile(null)
                        });
                    }}
                />
            )}
        </div>
    );
}

function MediaCard({ file, onSelect, onCopy, onDelete }: {
    file: MediaFile,
    onSelect: (f: MediaFile) => void,
    onCopy: (url: string) => void,
    onDelete: (id: string) => void
}) {
    const isImage = file.file_type === 'image';
    const isVideo = file.file_type === 'video';

    return (
        <Card className="group overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer" onClick={() => onSelect(file)}>
            <div className="aspect-square relative bg-slate-100 flex items-center justify-center">
                {isImage ? (
                    <img
                        src={file.public_url}
                        alt={file.alt_text || file.original_filename}
                        className="w-full h-full object-cover"
                    />
                ) : isVideo ? (
                    <Video className="h-10 w-10 text-slate-400" />
                ) : (
                    <File className="h-10 w-10 text-slate-400" />
                )}

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-md">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onSelect(file)}>
                                <Info className="mr-2 h-4 w-4" /> Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCopy(file.public_url)}>
                                <Copy className="mr-2 h-4 w-4" /> Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href={file.public_url} download target="_blank" rel="noreferrer">
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(file.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <CardFooter className="p-2 bg-white flex flex-col items-start gap-1">
                <p className="text-xs font-medium truncate w-full">{file.original_filename}</p>
                <div className="flex items-center justify-between w-full">
                    <p className="text-[10px] text-muted-foreground uppercase">{file.file_type}</p>
                    <p className="text-[10px] text-muted-foreground">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            </CardFooter>
        </Card>
    );
}

function DetailsDialog({ file, open, onOpenChange, onSave }: {
    file: MediaFile,
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onSave: (updates: any) => void
}) {
    const [formData, setFormData] = useState({
        alt_text: file.alt_text || '',
        caption: file.caption || '',
        folder: file.folder || 'uploads'
    });

    const isImage = file.file_type === 'image';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Media Details</DialogTitle>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 py-4">
                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {isImage ? (
                            <img src={file.public_url} alt="" className="w-full h-full object-contain" />
                        ) : (
                            <File className="h-16 w-16 text-slate-300" />
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-1.5">
                            <Label>Filename</Label>
                            <p className="text-sm font-mono break-all bg-slate-50 p-2 rounded">{file.original_filename}</p>
                        </div>

                        {isImage && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="alt">Alt Text</Label>
                                <Input
                                    id="alt"
                                    placeholder="Describe this image for screen readers"
                                    value={formData.alt_text}
                                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="grid gap-1.5">
                            <Label htmlFor="caption">Caption</Label>
                            <Textarea
                                id="caption"
                                placeholder="Caption displayed with the media"
                                value={formData.caption}
                                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Metadata</Label>
                            <div className="text-xs space-y-1 text-muted-foreground">
                                <p>Uploaded: {format(new Date(file.created_at), 'PPP')}</p>
                                <p>Size: {(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                                {file.width && <p>Dimensions: {file.width} x {file.height}</p>}
                                <p>Type: {file.mime_type}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onSave(formData)}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
