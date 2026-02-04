import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import {
    Sparkles,
    Download,
    Share2,
    Play,
    Copy,
    Trash2,
    CheckCircle2,
    Target,
    TrendingUp,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    X,
    Layout,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SlideThumbnailList } from "@/components/presentations/SlideThumbnailList";
import { SlidePropertiesPanel } from "@/components/presentations/SlidePropertiesPanel";
import { PresentationCanvas } from "@/components/presentations/PresentationCanvas";

// --- MOCK DATA ---
const MOCK_SLIDES = [
    {
        id: "slide-1",
        orderIndex: 0,
        type: "title",
        content: {
            title: "Enterprise Cloud Migration",
            subtitle: "Weekly Status Update - Week 33",
            theme: "blue"
        }
    },
    {
        id: "slide-2",
        orderIndex: 1,
        type: "summary",
        content: {
            title: "Executive Summary",
            theme: "green"
        }
    },
    {
        id: "slide-3",
        orderIndex: 2,
        type: "metrics",
        content: {
            title: "Project Health Dashboard",
            theme: "blue"
        }
    },
    {
        id: "slide-4",
        orderIndex: 3,
        type: "custom", // Will render a generic slide or we can add 'risk' type logic
        content: {
            title: "Active Risks",
            theme: "red"
        }
    }
];

const MOCK_CONTEXT = {
    code: "ECM-2024",
    date: "1/20/2026",
    author: "Sarah Mitchell"
};

export default function PresentationDemo() {
    const { toast } = useToast();
    const [slides, setSlides] = useState(MOCK_SLIDES);
    const [activeSlideId, setActiveSlideId] = useState<string | null>("slide-1");
    const [isPresentMode, setIsPresentMode] = useState(false);
    const [title, setTitle] = useState("Project Status Update");

    const activeSlide = slides.find(s => s.id === activeSlideId) || null;

    // --- HANDLERS ---

    const handleAddSlide = () => {
        const newId = `slide-${slides.length + 1}`;
        const newSlide = {
            id: newId,
            orderIndex: slides.length,
            type: "title",
            content: {
                title: "New Slide",
                theme: "blue"
            }
        };
        setSlides([...slides, newSlide]);
        setActiveSlideId(newId);
        toast({ title: "Slide Added", description: "This is a demo action." });
    };

    const handleUpdateSlide = (updates: any) => {
        if (!activeSlideId) return;
        setSlides(prev => prev.map(s => s.id === activeSlideId ? { ...s, ...updates } : s));
    };

    const handleDeleteSlide = (id: string) => {
        const idx = slides.findIndex(s => s.id === id);
        const newSlides = slides.filter(s => s.id !== id);
        setSlides(newSlides);
        if (id === activeSlideId) {
            // Select nearest
            const newActive = newSlides[Math.max(0, idx - 1)];
            setActiveSlideId(newActive ? newActive.id : null);
        }
        toast({ title: "Slide Deleted", description: "This is a demo action." });
    };

    const navigateSlide = (dir: 'next' | 'prev') => {
        const idx = slides.findIndex(s => s.id === activeSlideId);
        if (dir === 'next' && idx < slides.length - 1) {
            setActiveSlideId(slides[idx + 1].id);
        } else if (dir === 'prev' && idx > 0) {
            setActiveSlideId(slides[idx - 1].id);
        }
    };

    // Keyboard controls for Present Mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPresentMode) return;
            if (e.key === "ArrowRight" || e.key === " ") navigateSlide('next');
            if (e.key === "ArrowLeft") navigateSlide('prev');
            if (e.key === "Escape") setIsPresentMode(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isPresentMode, activeSlideId, slides]);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans uppercase-none">
            {/* Present Mode Overlay */}
            {isPresentMode && (
                <div className="fixed inset-0 z-[100] bg-[#020617] flex items-center justify-center p-12 animate-in fade-in duration-300">
                    <div className="w-full h-full max-w-7xl aspect-video bg-slate-950 border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                        <PresentationCanvas activeSlide={activeSlide} projectContext={MOCK_CONTEXT} />

                        {/* Presenter Controls */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => navigateSlide('prev')}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest px-4">
                                SLIDE {slides.findIndex(s => s.id === activeSlideId) + 1} / {slides.length}
                            </span>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => navigateSlide('next')}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-4 bg-white/10 mx-2" />
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => setIsPresentMode(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar Identifier */}
            <div className="w-16 h-full flex flex-col items-center py-6 border-r border-slate-800 bg-slate-950">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20 mb-6">
                    <Layout className="w-5 h-5 text-white" />
                </div>
                <Link href="/">
                    <Button variant="ghost" size="icon" className="mb-2 text-slate-500 hover:text-white" title="Back to Dashboard">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
            </div>

            {/* Left Sidebar - Thumbnails */}
            <SlideThumbnailList
                slides={slides}
                activeSlideId={activeSlideId}
                onSelectSlide={setActiveSlideId}
                onAddSlide={handleAddSlide}
            />

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
                {/* Header Toolbar */}
                <header className="h-16 border-b border-border bg-background/80 flex items-center justify-between px-6 shrink-0 backdrop-blur-md">
                    <div className="flex items-center gap-4 flex-1">
                        <Input
                            className="bg-transparent border-border text-sm font-medium focus-visible:ring-0 max-w-[300px] h-9 text-foreground placeholder:text-muted-foreground"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" className="h-8 gap-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-semibold mr-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Generate
                        </Button>

                        <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border">
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-md"><Copy className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive rounded-md" onClick={() => activeSlideId && handleDeleteSlide(activeSlideId)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>

                        <div className="w-px h-4 bg-border mx-2" />

                        <Button variant="outline" className="h-8 border-border bg-background text-muted-foreground hover:bg-accent gap-2 text-xs">
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </Button>
                        <Button variant="outline" className="h-8 border-border bg-background text-muted-foreground hover:bg-accent gap-2 text-xs">
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                        </Button>
                        <Button
                            className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold px-4 text-xs ml-2 shadow-lg shadow-blue-500/20"
                            onClick={() => setIsPresentMode(true)}
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Present
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-12 flex items-center justify-center relative bg-background">
                    {activeSlide ? (
                        <div className="w-full max-w-6xl aspect-video bg-slate-950 border border-white/5 rounded-2xl shadow-2xl relative overflow-hidden group">
                            {/* Add extra custom content for Slide 4 if it's the custom one, otherwise use standard Canvas */}
                            {activeSlide.type === 'custom' ? (
                                <div className="w-full h-full p-20 relative flex flex-col">
                                    <div className="flex items-start justify-between mb-12">
                                        <h1 className="text-5xl font-black text-white tracking-tight">Active Risks</h1>
                                        <div className="px-4 py-1.5 rounded-full bg-slate-900 border border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400">
                                            {MOCK_CONTEXT.code}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-hidden">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-white/10 pb-4">
                                                <div className="col-span-6">Risk Description</div>
                                                <div className="col-span-2">Impact</div>
                                                <div className="col-span-2">Prob</div>
                                                <div className="col-span-2">Status</div>
                                            </div>
                                            {[
                                                { desc: "Data migration latency exceeds 4h window", impact: "High", prob: "Med", status: "Open" },
                                                { desc: "Vendor API rate limits during peak load", impact: "Med", prob: "High", status: "Mitigated" },
                                                { desc: "Key stakeholder unavailable for sign-off", impact: "High", prob: "Low", status: "Open" }
                                            ].map((risk, i) => (
                                                <div key={i} className="grid grid-cols-12 gap-4 px-4 py-4 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors items-center">
                                                    <div className="col-span-6 font-medium text-slate-200">{risk.desc}</div>
                                                    <div className="col-span-2"><span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">{risk.impact}</span></div>
                                                    <div className="col-span-2"><span className="text-slate-400 text-sm">{risk.prob}</span></div>
                                                    <div className="col-span-2"><span className="text-slate-400 text-sm">{risk.status}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="h-10 shrink-0 flex items-center justify-center gap-10 opacity-30 mt-auto">
                                        <div className="text-[11px] font-bold text-slate-400 tracking-[0.2em] uppercase">{MOCK_CONTEXT.date}</div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                        <div className="text-[11px] font-bold text-slate-400 tracking-[0.2em] uppercase">{MOCK_CONTEXT.author}</div>
                                    </div>
                                </div>
                            ) : (
                                <PresentationCanvas activeSlide={activeSlide} projectContext={MOCK_CONTEXT} />
                            )}
                        </div>
                    ) : (
                        <div className="text-slate-500 font-medium text-lg">Select a slide to start editing</div>
                    )}
                </main>
            </div>

            {/* Right Properties Panel */}
            <SlidePropertiesPanel
                activeSlide={activeSlide}
                onUpdateSlide={handleUpdateSlide}
                onDeleteSlide={handleDeleteSlide}
            />
        </div>
    );
}
