import React, { useState, useRef, useCallback } from "react";
import { useProjectContext } from "@/contexts/ProjectContext";
import {
    Plus, Trash2, Lock, Unlock, Users, MapPin,
    MessageSquare, ChevronDown, ChevronRight, Copy,
    AlertTriangle, X, Settings, GripVertical, Check,
    Calendar, Send, LayoutDashboard, Database,
    Clock, MoreHorizontal, Target, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── DATA & CONSTANTS ────────────────────────────────────────────────────────
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#f97316"];
const SWIMLANE_COLORS = ["#1e293b", "#312e81", "#4c1d95", "#1e3a5f", "#14532d", "#450a0a"];

interface Activity {
    id: string;
    name: string;
    start: number;
    duration: number;
    color: string;
    tags: string[];
    notes: string;
}

interface Swimlane {
    id: string;
    label: string;
    color: string;
    collapsed: boolean;
    activities: Activity[];
}

interface Team {
    id: string;
    name: string;
    location: string;
    color: string;
}

interface Site {
    id: string;
    name: string;
    region: string;
}

interface Comment {
    id: string;
    user: string;
    avatar: string;
    text: string;
    time: string;
    activityId: string | null;
}

const initialMonths = [
    { id: "1", label: "Mar 2025" }, { id: "2", label: "Apr 2025" }, { id: "3", label: "May 2025" },
    { id: "4", label: "Jun 2025" }, { id: "5", label: "Jul 2025" }, { id: "6", label: "Aug 2025" },
    { id: "7", label: "Sep 2025" }, { id: "8", label: "Oct 2025" }, { id: "9", label: "Nov 2025" },
    { id: "10", label: "Dec 2025" }, { id: "11", label: "Jan 2026" }, { id: "12", label: "Feb 2026" },
];

const initialSwimlanes: Swimlane[] = [
    {
        id: "pre-kickoff", label: "Pre-Kickoff", color: SWIMLANE_COLORS[0], collapsed: false,
        activities: [
            { id: "a1", name: "Resource Loading & Staffing", start: 0, duration: 3, color: COLORS[0], tags: ["resource"], notes: "Identify & onboard key resources" },
            { id: "a2", name: "Vendor Evaluation", start: 1, duration: 2, color: COLORS[1], tags: ["vendor"], notes: "RFP & vendor shortlisting" },
            { id: "a3", name: "Budget Approval", start: 0, duration: 2, color: COLORS[2], tags: ["finance"], notes: "Sign off on project budget" },
        ]
    },
    {
        id: "planning", label: "Planning & Design", color: SWIMLANE_COLORS[1], collapsed: false,
        activities: [
            { id: "a4", name: "Requirements Gathering", start: 2, duration: 3, color: COLORS[3], tags: ["planning"], notes: "" },
            { id: "a5", name: "Architecture Design", start: 4, duration: 2, color: COLORS[4], tags: ["design"], notes: "" },
            { id: "a6", name: "UX / UI Prototyping", start: 4, duration: 3, color: COLORS[5], tags: ["design"], notes: "" },
        ]
    },
    {
        id: "build", label: "Build & Develop", color: SWIMLANE_COLORS[2], collapsed: false,
        activities: [
            { id: "a7", name: "Backend Development", start: 5, duration: 4, color: COLORS[0], tags: ["dev"], notes: "" },
            { id: "a8", name: "Frontend Development", start: 5, duration: 4, color: COLORS[1], tags: ["dev"], notes: "" },
            { id: "a9", name: "Integration Development", start: 7, duration: 3, color: COLORS[2], tags: ["dev"], notes: "" },
        ]
    },
    {
        id: "testing", label: "Testing & QA", color: SWIMLANE_COLORS[3], collapsed: false,
        activities: [
            { id: "a10", name: "Unit & Integration Testing", start: 7, duration: 3, color: COLORS[3], tags: ["qa"], notes: "" },
            { id: "a11", name: "UAT (User Acceptance)", start: 9, duration: 2, color: COLORS[4], tags: ["qa"], notes: "" },
        ]
    },
    {
        id: "deploy", label: "Deployment & Go-Live", color: SWIMLANE_COLORS[4], collapsed: false,
        activities: [
            { id: "a12", name: "Staging Deployment", start: 9, duration: 1, color: COLORS[5], tags: ["deploy"], notes: "" },
            { id: "a13", name: "Go-Live", start: 10, duration: 1, color: COLORS[6], tags: ["golive"], notes: "🎯 TARGET GO-LIVE" },
            { id: "a14", name: "Post-Launch Support", start: 10, duration: 2, color: COLORS[7], tags: ["support"], notes: "" },
        ]
    }
];

const initialTeams: Team[] = [
    { id: "t1", name: "Core Platform Team", location: "Dubai", color: COLORS[0] },
    { id: "t2", name: "Design & UX Team", location: "London", color: COLORS[1] },
    { id: "t3", name: "QA & Testing Team", location: "Hyderabad", color: COLORS[2] },
];

const initialSites: Site[] = [
    { id: "s1", name: "Dubai HQ", region: "Middle East" },
    { id: "s2", name: "London Office", region: "Europe" },
    { id: "s3", name: "Hyderabad Dev Center", region: "Asia Pacific" },
];

const initialComments: Comment[] = [
    { id: "c1", user: "Sarah K.", avatar: "SK", text: "Resource loading for Backend needs to start earlier — vendor lead time is 6 weeks.", time: "2 hrs ago", activityId: "a1" },
    { id: "c2", user: "James M.", avatar: "JM", text: "UAT dates look tight. Can we extend by 1 week?", time: "45 min ago", activityId: "a11" },
];

// ─── UTILITY ─────────────────────────────────────────────────────────────────
let idCounter = 100;
const uid = () => `id_${++idCounter}`;

function Avatar({ initials, color = "#3b82f6", size = 28 }: { initials: string, color?: string, size?: number }) {
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", border: "2px solid #1e1e2e", letterSpacing: "-0.5px" }}>
            {initials}
        </div>
    );
}

function Tag({ label }: { label: string }) {
    return <span style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>;
}

function Tooltip({ text, children }: { text: string, children: React.ReactNode }) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: "relative", display: "inline-flex" }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {children}
            {show && <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#1e1e2e", border: "1px solid #333", color: "#cbd5e1", fontSize: 11, padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 99, pointerEvents: "none" }}>{text}</div>}
        </div>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export function TimelinePlannerTab() {
    const { settings, activeGlobalPanel, setActiveGlobalPanel } = useProjectContext();
    const [months, setMonths] = useState(initialMonths);
    const [swimlanes, setSwimlanes] = useState<Swimlane[]>(initialSwimlanes);
    const [goLiveIndex, setGoLiveIndex] = useState(10);
    const [goLiveLocked, setGoLiveLocked] = useState(true);
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [sites, setSites] = useState<Site[]>(initialSites);
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [showResourcePanel, setShowResourcePanel] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [newComment, setNewComment] = useState("");
    const [newMonthLabel, setNewMonthLabel] = useState("");
    const [addingMonth, setAddingMonth] = useState(false);

    const ACTIVITY_COL = 280;
    const MONTH_COL_W = 100;

    // ── Handlers ──
    const toggleCollapse = (id: string) => {
        setSwimlanes(prev => prev.map(s => s.id === id ? { ...s, collapsed: !s.collapsed } : s));
    };

    const addSwimlane = () => {
        setSwimlanes(prev => [...prev, {
            id: uid(), label: "New Phase", color: SWIMLANE_COLORS[prev.length % SWIMLANE_COLORS.length],
            collapsed: false, activities: []
        }]);
    };

    const deleteSwimlane = (id: string) => {
        setSwimlanes(prev => prev.filter(s => s.id !== id));
    };

    const renameSwimlane = (id: string, val: string) => {
        setSwimlanes(prev => prev.map(s => s.id === id ? { ...s, label: val } : s));
    };

    const duplicateSwimlane = (sw: Swimlane) => {
        const newLane = {
            ...sw, id: uid(), label: sw.label + " (Copy)",
            activities: sw.activities.map(a => ({ ...a, id: uid() }))
        };
        setSwimlanes(prev => [...prev, newLane]);
    };

    const addActivity = (swimId: string) => {
        setSwimlanes(prev => prev.map(s => s.id === swimId ? {
            ...s, activities: [...s.activities, {
                id: uid(), name: "New Activity", start: 0, duration: 2,
                color: COLORS[s.activities.length % COLORS.length], tags: [], notes: ""
            }]
        } : s));
    };

    const deleteActivity = (swimId: string, actId: string) => {
        setSwimlanes(prev => prev.map(s => s.id === swimId ? { ...s, activities: s.activities.filter(a => a.id !== actId) } : s));
    };

    const renameActivity = (swimId: string, actId: string, val: string) => {
        setSwimlanes(prev => prev.map(s => s.id === swimId ? { ...s, activities: s.activities.map(a => a.id === actId ? { ...a, name: val } : a) } : s));
    };

    const addMonth = () => {
        if (newMonthLabel.trim()) {
            setMonths(prev => [...prev, { id: uid(), label: newMonthLabel.trim() }]);
            setNewMonthLabel("");
            setAddingMonth(false);
        }
    };

    const removeMonth = (idx: number) => {
        setMonths(prev => prev.filter((_, i) => i !== idx));
        if (goLiveIndex > idx) setGoLiveIndex(gi => gi - 1);
    };

    const addComment = () => {
        if (!newComment.trim()) return;
        setComments(prev => [...prev, {
            id: uid(),
            user: "You",
            avatar: "YO",
            text: newComment.trim(),
            time: "Just now",
            activityId: selectedActivity?.id || null
        }]);
        setNewComment("");
    };

    const onBarMouseDown = (e: React.MouseEvent, swimId: string, actId: string, act: Activity, mode: 'move' | 'resize') => {
        e.preventDefault();
        const startX = e.clientX;
        const origStart = act.start;
        const origDur = act.duration;
        const pxPerMonth = MONTH_COL_W;

        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startX;
            const monthsDelta = Math.round(dx / pxPerMonth);
            if (mode === "move") {
                const newStart = Math.max(0, Math.min(months.length - origDur, origStart + monthsDelta));
                setSwimlanes(prev => prev.map(s => s.id === swimId ? { ...s, activities: s.activities.map(a => a.id === actId ? { ...a, start: newStart } : a) } : s));
            } else if (mode === "resize") {
                const newDur = Math.max(1, Math.min(months.length - origStart, origDur + monthsDelta));
                setSwimlanes(prev => prev.map(s => s.id === swimId ? { ...s, activities: s.activities.map(a => a.id === actId ? { ...a, duration: newDur } : a) } : s));
            }
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const getResourceLoad = () => {
        const load = Array(months.length).fill(0);
        swimlanes.forEach(s => s.activities.forEach(a => {
            for (let i = a.start; i < a.start + a.duration && i < months.length; i++) load[i]++;
        }));
        return load;
    };
    const resourceLoad = getResourceLoad();
    const maxLoad = Math.max(...resourceLoad, 1);

    return (
        <div className="h-full flex flex-col bg-background text-foreground">
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between bg-card z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 rotate-3">
                        <Calendar className="h-7 w-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                            Scenario Planner
                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-black border-primary/20 text-primary bg-primary/5">Plan on a Page</Badge>
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-500" /> {sites.length} Active Sites</span>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-indigo-500" /> {teams.length} Global Teams</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer shadow-sm",
                        goLiveLocked ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                    )} onClick={() => setActiveGlobalPanel('settings')}>
                        {goLiveLocked ? <Lock size={15} /> : <Unlock size={15} />}
                        <span className="text-xs font-black uppercase tracking-wider">Target: {months[goLiveIndex]?.label || "—"}</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResourcePanel(!showResourcePanel)}
                        className={cn("gap-2 h-10 px-4 rounded-xl", showResourcePanel && "bg-orange-500/10 border-orange-500/30 text-orange-600")}
                    >
                        📊 Resources
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveGlobalPanel(activeGlobalPanel === 'settings' ? null : 'settings')}
                        className={cn("h-10 w-10 rounded-xl", activeGlobalPanel === 'settings' && "bg-accent")}
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* ── MAIN GANTT AREA ── */}
                <ScrollArea className="flex-1 bg-slate-50/50 dark:bg-slate-950/20">
                    <div style={{ minWidth: ACTIVITY_COL + months.length * MONTH_COL_W + 150 }} className="p-4">
                        <Card className="border-none shadow-xl shadow-black/5 overflow-hidden ring-1 ring-black/5">
                            {/* Month Header */}
                            <div className="sticky top-0 z-20 bg-card border-b flex items-center h-20">
                                <div style={{ width: ACTIVITY_COL }} className="border-r px-6 flex items-center justify-between shrink-0 h-full bg-card/80 backdrop-blur-md">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Activities</h3>
                                    <Button size="sm" variant="outline" onClick={addSwimlane} className="h-8 text-[11px] gap-1.5 px-3 rounded-lg border-primary/20 hover:border-primary/50 text-primary bg-primary/5 font-black hover:bg-primary/10 transition-all">
                                        <Plus className="h-3.5 w-3.5" /> PHASE
                                    </Button>
                                </div>
                                {months.map((m, i) => (
                                    <div
                                        key={m.id}
                                        style={{ width: MONTH_COL_W }}
                                        className={cn(
                                            "border-r h-full flex flex-col items-center justify-center shrink-0 relative transition-all group/month",
                                            i === goLiveIndex ? "bg-red-500/5 shadow-[inset_0_-4px_0_0_#ef4444]" : "hover:bg-muted/30"
                                        )}
                                    >
                                        <div className={cn("text-[10px] font-black uppercase tracking-widest", i === goLiveIndex ? "text-red-500" : "text-muted-foreground/60")}>
                                            {m.label.split(' ')[0]}
                                        </div>
                                        <div className={cn("text-sm font-black", i === goLiveIndex ? "text-red-600" : "text-foreground")}>
                                            {m.label.split(' ')[1]}
                                        </div>
                                        {i === goLiveIndex && <div className="text-[9px] text-red-500 font-black mt-0.5 animate-bounce">TARGET</div>}
                                        <button
                                            onClick={() => removeMonth(i)}
                                            className="absolute top-2 right-2 opacity-0 group-hover/month:opacity-50 hover:!opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add Month Button */}
                                <div style={{ width: 120 }} className="p-4 shrink-0 flex items-center justify-center">
                                    {addingMonth ? (
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <Input
                                                autoFocus
                                                value={newMonthLabel}
                                                onChange={e => setNewMonthLabel(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && addMonth()}
                                                placeholder="Mar 2026"
                                                className="h-8 text-[11px] px-2 rounded-lg"
                                            />
                                            <div className="flex gap-1.5">
                                                <Button size="sm" onClick={addMonth} className="h-7 flex-1 text-[10px] p-0 rounded-lg"><Check className="h-3.5 w-3.5" /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => setAddingMonth(false)} className="h-7 flex-1 text-[10px] p-0 rounded-lg"><X className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setAddingMonth(true)}
                                            className="h-10 w-full border-dashed rounded-xl text-[11px] font-black gap-1.5 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> MONTH
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Resource Load Bar */}
                            {showResourcePanel && (
                                <div className="flex border-b bg-muted/5">
                                    <div style={{ width: ACTIVITY_COL }} className="border-r px-6 py-4 shrink-0">
                                        <div className="text-[11px] font-black text-orange-600 uppercase tracking-widest">📊 Resource Load</div>
                                        <div className="text-[9px] text-muted-foreground font-medium mt-1">Activities per month</div>
                                    </div>
                                    {months.map((m, i) => {
                                        const load = resourceLoad[i];
                                        const pct = (load / maxLoad) * 100;
                                        const hue = load > maxLoad * 0.75 ? "#ef4444" : load > maxLoad * 0.5 ? "#f59e0b" : "#10b981";
                                        return (
                                            <div key={m.id} style={{ width: MONTH_COL_W }} className="border-r shrink-0 px-3 py-4 flex flex-col gap-2">
                                                <div style={{ background: "#1e1e2e", borderRadius: 4, height: 28, display: "flex", alignItems: "flex-end", overflow: "hidden", padding: "3px 0" }}>
                                                    <div style={{ width: "100%", height: `${pct}%`, background: hue, borderRadius: "3px 3px 0 0", transition: "height 0.3s", minHeight: load > 0 ? 4 : 0 }} />
                                                </div>
                                                <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: hue }}>{load}</div>
                                            </div>
                                        );
                                    })}
                                    <div style={{ width: 120 }} className="shrink-0" />
                                </div>
                            )}

                            {/* Swimlanes */}
                            {swimlanes.map((sw) => (
                                <div key={sw.id} className="group/lane">
                                    {/* Swimlane Header */}
                                    <div className="flex items-center bg-muted/20 border-b h-12">
                                        <div style={{ width: ACTIVITY_COL }} className="border-r px-4 py-2 flex items-center gap-3 shrink-0 h-full bg-muted/10 relative">
                                            <div style={{ width: 4, position: 'absolute', left: 0, top: 4, bottom: 4, background: sw.color, borderRadius: '0 4px 4px 0' }} />
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted/50 rounded-lg" onClick={() => toggleCollapse(sw.id)}>
                                                {sw.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                            <input
                                                value={sw.label}
                                                onChange={e => renameSwimlane(sw.id, e.target.value)}
                                                className="flex-1 bg-transparent border-none text-[13px] font-black uppercase tracking-widest outline-none truncate placeholder:text-muted-foreground/30"
                                            />
                                            <div className="flex items-center opacity-0 group-hover/lane:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-white/50 dark:hover:bg-slate-800" onClick={() => duplicateSwimlane(sw)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => deleteSwimlane(sw.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {months.map((m, i) => (
                                            <div key={m.id} style={{ width: MONTH_COL_W }} className={cn("border-r shrink-0 h-full", i === goLiveIndex && "bg-red-500/5")} />
                                        ))}
                                        <div style={{ width: 120 }} className="shrink-0 h-full" />
                                    </div>

                                    {/* Activities */}
                                    {!sw.collapsed && (
                                        <div className="relative">
                                            {sw.activities.map((act) => (
                                                <div key={act.id} className="flex items-center border-b min-h-[52px] group/act hover:bg-muted/10 transition-colors">
                                                    <div style={{ width: ACTIVITY_COL }} className={cn(
                                                        "border-r pl-12 pr-4 py-2 flex items-center gap-3 shrink-0 h-[52px] transition-all relative",
                                                        selectedActivity?.id === act.id ? "bg-indigo-50 dark:bg-indigo-900/10 shadow-[inset_4px_0_0_0_#6366f1]" : "bg-card/30"
                                                    )}>
                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.color, boxShadow: `0 0 8px ${act.color}80` }} className="shrink-0" />
                                                        <input
                                                            value={act.name}
                                                            onChange={e => renameActivity(sw.id, act.id, e.target.value)}
                                                            className="flex-1 bg-transparent border-none text-sm font-bold outline-none truncate placeholder:text-muted-foreground/30"
                                                        />
                                                        <div className="flex items-center gap-1 opacity-0 group-hover/act:opacity-100 transition-opacity shrink-0">
                                                            {act.tags.map(t => <Tag key={t} label={t} />)}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={cn("h-8 w-8 p-0 rounded-lg", comments.some(c => c.activityId === act.id) && "text-indigo-600 bg-indigo-500/5")}
                                                                onClick={() => {
                                                                    setSelectedActivity(act);
                                                                    // setActivePanel('chat'); // Removed chat panel
                                                                }}
                                                            >
                                                                <MessageSquare className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg" onClick={() => deleteActivity(sw.id, act.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="relative flex flex-1 h-[52px] shrink-0 overflow-visible">
                                                        {months.map((m, i) => (
                                                            <div key={m.id} style={{ width: MONTH_COL_W }} className={cn("border-r h-full shrink-0", i === goLiveIndex && "bg-red-500/5")} />
                                                        ))}

                                                        {/* Activity Bar */}
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                top: 10,
                                                                height: 32,
                                                                borderRadius: 10,
                                                                left: act.start * MONTH_COL_W + 8,
                                                                width: act.duration * MONTH_COL_W - 16,
                                                                background: `linear-gradient(135deg, ${act.color}, ${act.color}dd)`,
                                                                zIndex: 10,
                                                            }}
                                                            className="flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xl shadow-black/10 ring-2 ring-white/10 group/bar border border-white/20 transition-transform active:scale-[0.98]"
                                                            onMouseDown={(e) => onBarMouseDown(e, sw.id, act.id, act, "move")}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedActivity(act);
                                                                // setActivePanel('chat'); // Removed chat panel
                                                            }}
                                                        >
                                                            <span className="text-[11px] text-white font-black truncate px-3 pointer-events-none drop-shadow-md tracking-tight uppercase">
                                                                {act.duration >= 2 ? act.name : ""}
                                                            </span>

                                                            {/* Resize Handle */}
                                                            <div
                                                                className="absolute right-0 top-0 bottom-0 w-4 cursor-e-resize flex items-center justify-center hover:bg-white/20 rounded-r-lg transition-all group-hover/bar:bg-white/5"
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    onBarMouseDown(e, sw.id, act.id, act, "resize");
                                                                }}
                                                            >
                                                                <div className="w-1 h-4 bg-white/40 rounded-full" />
                                                            </div>

                                                            {/* Comment Indicator */}
                                                            {comments.some(c => c.activityId === act.id) && (
                                                                <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-600 border-[3px] border-white rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                                                                    <MessageSquare className="h-2.5 w-2.5 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ width: 120 }} className="shrink-0 h-full" />
                                                </div>
                                            ))}

                                            {/* Add Activity Row */}
                                            <div className="flex items-center border-b h-12 group/add">
                                                <div style={{ width: ACTIVITY_COL }} className="border-r pl-12 pr-6 shrink-0 h-full flex items-center bg-muted/5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full h-8 text-[11px] gap-2 border border-dashed border-primary/20 hover:border-primary/50 text-primary/70 hover:text-primary transition-all font-black uppercase tracking-widest rounded-xl hover:bg-primary/5"
                                                        onClick={() => addActivity(sw.id)}
                                                    >
                                                        <Plus className="h-4 w-4" /> ADD ITEM
                                                    </Button>
                                                </div>
                                                <div className="flex-1 flex h-full">
                                                    {months.map((m, i) => (
                                                        <div key={m.id} style={{ width: MONTH_COL_W }} className={cn("border-r h-full shrink-0", i === goLiveIndex && "bg-red-500/5")} />
                                                    ))}
                                                </div>
                                                <div style={{ width: 120 }} className="shrink-0 h-full border-r" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Resource Load Summary */}
                            <div className="mt-12 bg-card border-t shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
                                <div className="flex items-center bg-muted/10 border-b h-12">
                                    <div style={{ width: ACTIVITY_COL }} className="border-r px-6 shrink-0 h-full flex items-center">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" /> Resource Intensity
                                        </h3>
                                    </div>
                                    {months.map((m) => (
                                        <div key={m.id} style={{ width: MONTH_COL_W }} className="border-r shrink-0 h-full" />
                                    ))}
                                </div>
                                <div className="flex items-center group relative h-48">
                                    <div style={{ width: ACTIVITY_COL }} className="border-r px-6 bg-card flex flex-col justify-center gap-1 shrink-0 h-full">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black tracking-tight">Global Capacity</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">Aggregated across teams</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-muted/30 rounded-xl border border-dashed space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                                                <span>Peak Load</span>
                                                <span className="text-red-600">{maxLoad} Tasks/Mo</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: '85%' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 relative h-full items-end pb-4 bg-muted/5">
                                        {months.map((m, i) => {
                                            const load = resourceLoad[i];
                                            const pct = (load / maxLoad) * 100;
                                            const isOverload = load > 4;
                                            const isMedium = load > 2;

                                            return (
                                                <div key={m.id} style={{ width: MONTH_COL_W }} className="border-r h-full flex flex-col justify-end px-4 shrink-0 transition-all hover:bg-primary/5">
                                                    <div
                                                        style={{ height: `${Math.max(10, pct)}%` }}
                                                        className={cn(
                                                            "w-full rounded-t-2xl transition-all border border-b-0 relative group/intensity shadow-sm flex flex-col items-center justify-start py-2",
                                                            isOverload ? "bg-gradient-to-t from-red-600/60 to-red-400/80 border-red-500/50" :
                                                                isMedium ? "bg-gradient-to-t from-orange-500/60 to-orange-300/80 border-orange-400/50" :
                                                                    "bg-gradient-to-t from-indigo-500/60 to-indigo-300/80 border-indigo-400/50"
                                                        )}
                                                    >
                                                        <div className="text-white font-black text-xs drop-shadow-md">{load}</div>
                                                        <div className="absolute -top-10 scale-0 group-hover/intensity:scale-100 transition-transform bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-xl z-50 pointer-events-none">
                                                            {Math.floor(pct)}% CAPACITY
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ width: 120 }} className="shrink-0 h-full" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </ScrollArea>

                {/* ── RIGHT PANEL (Settings) ── */}
                {activeGlobalPanel === 'settings' && (
                    <Card className="w-96 border-l bg-card flex flex-col shrink-0 rounded-none shadow-2xl z-40 h-full overflow-hidden">
                        <div className="w-full border-b h-16 bg-muted/20 p-2 gap-2 shrink-0 flex items-center justify-center">
                            <h3 className="font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                                <Settings className="h-4 w-4" /> SYSTEM CONFIG
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-primary">System Config Active</h4>
                                <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary/70">PRO</Badge>
                            </div>
                            <div className="p-6 space-y-10">
                                {/* Go-Live Settings */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 text-[14px] font-black tracking-tight mb-2">
                                        <span className="text-xl">🎯</span> Go-Live Configuration
                                    </div>
                                    <Card className="p-6 space-y-5 bg-muted/30 border-none shadow-sm ring-1 ring-white/5 rounded-[24px]">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[12px] font-bold text-muted-foreground">Target</Label>
                                            <Select value={goLiveIndex.toString()} onValueChange={val => setGoLiveIndex(parseInt(val))}>
                                                <SelectTrigger className="w-[180px] h-11 rounded-xl bg-card border-white/5 shadow-sm font-bold text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-white/10 shadow-2xl">
                                                    {months.map((m, i) => (
                                                        <SelectItem key={m.id} value={i.toString()} className="rounded-lg py-3">{m.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[12px] font-bold text-muted-foreground">Lock</Label>
                                            <Button
                                                variant={goLiveLocked ? "destructive" : "outline"}
                                                size="sm"
                                                className={cn(
                                                    "h-11 px-6 rounded-xl gap-2 font-black text-[12px] tracking-tight",
                                                    goLiveLocked ? "bg-red-500/20 border-red-500/40 text-red-500 hover:bg-red-500/30" : ""
                                                )}
                                                onClick={() => setGoLiveLocked(!goLiveLocked)}
                                            >
                                                {goLiveLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                                {goLiveLocked ? "Locked (Fixed)" : "Unlocked"}
                                            </Button>
                                        </div>
                                        {goLiveLocked && (
                                            <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                                                <AlertTriangle size={16} className="text-orange-500 shrink-0" />
                                                <span className="text-[11px] text-muted-foreground font-medium">Activities beyond Go-Live will be flagged</span>
                                            </div>
                                        )}
                                    </Card>
                                </div>

                                {/* Sites */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-[14px] font-black tracking-tight">
                                            <span className="text-xl">📍</span> Sites / Locations
                                        </div>
                                        <Button size="sm" variant="secondary" className="h-8 rounded-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 gap-1.5 font-bold" onClick={() => setSites([...sites, { id: uid(), name: "New Site", region: "—" }])}>
                                            <Plus className="h-4 w-4" /> Add
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {sites.map((s) => (
                                            <div key={s.id} className="flex items-center gap-4 p-4 bg-muted/20 rounded-[24px] border border-transparent shadow-sm hover:border-emerald-500/20 hover:shadow-emerald-500/5 transition-all group/item ring-1 ring-black/5">
                                                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 group-hover/item:scale-110 transition-transform">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 overflow-hidden text-foreground">
                                                    <input
                                                        value={s.name}
                                                        onChange={e => setSites(sites.map(x => x.id === s.id ? { ...x, name: e.target.value } : x))}
                                                        className="w-full bg-transparent border-none text-[13px] font-black tracking-tight outline-none"
                                                    />
                                                    <div className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest">{s.region} Distribution</div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-all" onClick={() => setSites(sites.filter(x => x.id !== s.id))}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Teams */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-[14px] font-black tracking-tight">
                                            <span className="text-xl">👥</span> Teams
                                        </div>
                                        <Button size="sm" variant="secondary" className="h-8 rounded-[10px] bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 gap-1.5 font-bold" onClick={() => setTeams([...teams, { id: uid(), name: "New Team", location: "—", color: COLORS[teams.length % COLORS.length] }])}>
                                            <Plus className="h-4 w-4" /> Add
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {teams.map((t) => (
                                            <div key={t.id} className="flex items-center gap-4 p-4 bg-muted/20 rounded-[24px] border border-transparent shadow-sm hover:border-indigo-500/20 transition-all group/team ring-1 ring-black/5">
                                                <div style={{ background: t.color }} className="h-10 w-10 rounded-2xl flex items-center justify-center border border-white/20 shadow-lg ring-4 ring-background transform -rotate-3 group-hover/team:rotate-0 transition-transform">
                                                    <Users className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1 overflow-hidden text-foreground">
                                                    <input
                                                        value={t.name}
                                                        onChange={e => setTeams(teams.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))}
                                                        className="w-full bg-transparent border-none text-[13px] font-black tracking-tight outline-none"
                                                    />
                                                    <div className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest">{t.location} Delivery Center</div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 opacity-0 group-hover/team:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-all" onClick={() => setTeams(teams.filter(x => x.id !== t.id))}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Scenario Snapshots */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 text-[14px] font-black tracking-tight">
                                        <span className="text-xl">📸</span> Scenario Snapshots
                                    </div>
                                    <div className="space-y-3">
                                        {["Baseline Plan", "Aggressive Timeline", "Conservative"].map((name, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 bg-muted/20 rounded-[20px] border border-white/5 shadow-sm ring-1 ring-black/5 hover:bg-muted/40 transition-colors">
                                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: ["#10b981", "#f59e0b", "#60a5fa"][i] }} />
                                                <span className="text-[13px] font-black tracking-tight flex-1 text-foreground">{name}</span>
                                                <span className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">{["Active", "Saved", "Saved"][i]}</span>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            className="w-full h-11 border-dashed border-white/10 rounded-2xl text-[12px] gap-2 font-black uppercase tracking-widest text-primary/70 hover:text-primary hover:border-primary/40 transition-all bg-primary/5"
                                        >
                                            + Save Current as Snapshot
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}