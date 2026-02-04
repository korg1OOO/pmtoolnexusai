import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
    Sparkles,
    Download,
    Share2,
    Play,
    Copy,
    Trash2,
    Loader2,
    Calendar,
    User,
    ChevronLeft,
    ChevronRight,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject } from "@/context/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SlideThumbnailList } from "@/components/presentations/SlideThumbnailList";
import { SlidePropertiesPanel } from "@/components/presentations/SlidePropertiesPanel";
import { PresentationCanvas } from "@/components/presentations/PresentationCanvas";
import { cn } from "@/lib/utils";

export default function PresentationEditor() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const { currentProject } = useProject();
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();
    const [activeSlideId, setActiveSlideId] = React.useState<string | null>(null);
    const [isPresentMode, setIsPresentMode] = React.useState(false);

    const { data: presentation, isLoading } = useQuery<any>({
        queryKey: ["/api/presentations", id],
        enabled: !!id,
    });

    const slides = presentation?.slides || [];
    const activeSlide = slides.find((s: any) => s.id === activeSlideId) || (slides.length > 0 ? slides[0] : null);

    React.useEffect(() => {
        if (slides.length > 0 && !activeSlideId) {
            setActiveSlideId(slides[0].id);
        }
    }, [slides, activeSlideId]);

    const addSlideMutation = useMutation({
        mutationFn: async (type: string = "text") => {
            const newSlide = {
                presentationId: id,
                orderIndex: slides.length,
                type: type,
                content: {
                    title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Slide`,
                    body: "Add your content here...",
                },
            };
            const res = await apiRequest("POST", `/api/presentations/${id}/slides`, newSlide);
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/presentations", id] });
            setActiveSlideId(data.id);
            toast({ title: "Slide Added" });
        },
    });

    const updateSlideMutation = useMutation({
        mutationFn: async (updates: any) => {
            const updated = { ...activeSlide, ...updates };
            const res = await apiRequest("POST", `/api/presentations/${id}/slides`, updated);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/presentations", id] });
        },
    });

    const deleteSlideMutation = useMutation({
        mutationFn: async (slideId: string) => {
            await apiRequest("DELETE", `/api/presentations/${id}/slides/${slideId}`, {});
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/presentations", id] });
            if (activeSlideId === variables) {
                setActiveSlideId(slides.find((s: any) => s.id !== variables)?.id || null);
            }
            toast({ title: "Slide Deleted" });
        },
    });

    // Navigation for present mode
    const navigateSlide = (dir: 'next' | 'prev') => {
        const idx = slides.findIndex((s: any) => s.id === activeSlideId);
        if (dir === 'next' && idx < slides.length - 1) {
            setActiveSlideId(slides[idx + 1].id);
        } else if (dir === 'prev' && idx > 0) {
            setActiveSlideId(slides[idx - 1].id);
        }
    };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPresentMode) return;
            if (e.key === "ArrowRight" || e.key === " ") navigateSlide('next');
            if (e.key === "ArrowLeft") navigateSlide('prev');
            if (e.key === "Escape") setIsPresentMode(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isPresentMode, activeSlideId, slides]);

    if (isLoading) return (
        <div className="flex items-center justify-center h-screen bg-[#020617]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    );

    return (
        <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans uppercase-none">
            {/* Present Mode Overlay */}
            {isPresentMode && (
                <div className="fixed inset-0 z-[100] bg-[#020617] flex items-center justify-center p-12">
                    <div className="w-full h-full max-w-7xl aspect-video bg-slate-950 border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden">
                        <PresentationCanvas activeSlide={activeSlide} />

                        {/* Presenter Controls Overlay - Visible on Hover */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-xl opacity-0 hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigateSlide('prev')}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest px-4">
                                SLIDE {slides.findIndex((s: any) => s.id === activeSlideId) + 1} / {slides.length}
                            </span>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigateSlide('next')}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-4 bg-white/10 mx-2" />
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setIsPresentMode(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Left Sidebar - Thumbnails */}
            <SlideThumbnailList
                slides={slides}
                activeSlideId={activeSlideId}
                onSelectSlide={setActiveSlideId}
                onAddSlide={() => addSlideMutation.mutate("text")}
            />

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Toolbar */}
                <header className="h-16 border-b border-white/5 bg-slate-950/20 flex items-center justify-between px-6 shrink-0 backdrop-blur-md">
                    <div className="flex items-center gap-4 flex-1">
                        <Input
                            className="bg-transparent border-none text-lg font-bold p-0 focus-visible:ring-0 max-w-[300px] h-10 truncate"
                            value={presentation?.title || "Untitled Presentation"}
                            readOnly
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className="h-9 gap-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10">
                            <Sparkles className="w-4 h-4" />
                            AI Generate
                        </Button>
                        <div className="w-px h-4 bg-slate-800 mx-1" />
                        <Button variant="ghost" size="icon" className="w-9 h-9 text-slate-400 hover:text-white"><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-9 h-9 text-slate-400 hover:text-red-400" onClick={() => activeSlideId && deleteSlideMutation.mutate(activeSlideId)}><Trash2 className="w-4 h-4" /></Button>
                        <div className="w-px h-4 bg-slate-800 mx-1" />
                        <Button variant="outline" className="h-9 border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                        <Button variant="outline" className="h-9 border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 gap-2">
                            <Share2 className="w-4 h-4" />
                            Share
                        </Button>
                        <Button
                            className="h-9 bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold px-5"
                            onClick={() => setIsPresentMode(true)}
                        >
                            <Play className="w-4 h-4 fill-current" />
                            Present
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-12 bg-[#020617] flex items-center justify-center relative">
                    {activeSlide ? (
                        <div className="w-full max-w-5xl aspect-video bg-slate-950 border border-white/5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                            <PresentationCanvas activeSlide={activeSlide} />
                        </div>
                    ) : (
                        <div className="text-slate-500 font-medium text-lg">Select a slide to start editing</div>
                    )}
                </main>
            </div>

            {/* Right Properties Panel */}
            <SlidePropertiesPanel
                activeSlide={activeSlide}
                onUpdateSlide={updateSlideMutation.mutate}
                onDeleteSlide={deleteSlideMutation.mutate}
            />
        </div>
    );
}
