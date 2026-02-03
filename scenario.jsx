
import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Trash2, Lock, Unlock, Users, MapPin, MessageSquare, ChevronDown, ChevronRight, GripVertical, Copy, AlertTriangle, Check, X, Settings } from "lucide-react";

// ─── DATA & CONSTANTS ────────────────────────────────────────────────────────
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444","#06b6d4","#f97316"];
const SWIMLANE_COLORS = ["#1e293b","#312e81","#4c1d95","#1e3a5f","#14532d","#450a0a"];

const initialMonths = [
  { id: 1, label: "Mar 2025" }, { id: 2, label: "Apr 2025" }, { id: 3, label: "May 2025" },
  { id: 4, label: "Jun 2025" }, { id: 5, label: "Jul 2025" }, { id: 6, label: "Aug 2025" },
  { id: 7, label: "Sep 2025" }, { id: 8, label: "Oct 2025" }, { id: 9, label: "Nov 2025" },
  { id: 10, label: "Dec 2025" }, { id: 11, label: "Jan 2026" }, { id: 12, label: "Feb 2026" },
];

const initialSwimlanes = [
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

const initialTeams = [
  { id: "t1", name: "Core Platform Team", location: "Dubai", color: COLORS[0] },
  { id: "t2", name: "Design & UX Team", location: "London", color: COLORS[1] },
  { id: "t3", name: "QA & Testing Team", location: "Hyderabad", color: COLORS[2] },
];

const initialSites = [
  { id: "s1", name: "Dubai HQ", region: "Middle East" },
  { id: "s2", name: "London Office", region: "Europe" },
  { id: "s3", name: "Hyderabad Dev Center", region: "Asia Pacific" },
];

const initialComments = [
  { id: "c1", user: "Sarah K.", avatar: "SK", text: "Resource loading for Backend needs to start earlier — vendor lead time is 6 weeks.", time: "2 hrs ago", activityId: "a1" },
  { id: "c2", user: "James M.", avatar: "JM", text: "UAT dates look tight. Can we extend by 1 week?", time: "45 min ago", activityId: "a11" },
];

// ─── UTILITY ─────────────────────────────────────────────────────────────────
let idCounter = 100;
const uid = () => `id_${++idCounter}`;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Avatar({ initials, color = "#3b82f6", size = 28 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", border: "2px solid #1e1e2e", letterSpacing: "-0.5px" }}>
      {initials}
    </div>
  );
}

function Tag({ label }) {
  return <span style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>;
}

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#1e1e2e", border: "1px solid #333", color: "#cbd5e1", fontSize: 11, padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 99, pointerEvents: "none" }}>{text}</div>}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function ScenarioPage() {
  const [months, setMonths] = useState(initialMonths);
  const [swimlanes, setSwimlanes] = useState(initialSwimlanes);
  const [goLiveIndex, setGoLiveIndex] = useState(10); // month index (0-based)
  const [goLiveLocked, setGoLiveLocked] = useState(true);
  const [teams, setTeams] = useState(initialTeams);
  const [sites, setSites] = useState(initialSites);
  const [comments, setComments] = useState(initialComments);
  const [showComments, setShowComments] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [newMonthLabel, setNewMonthLabel] = useState("");
  const [addingMonth, setAddingMonth] = useState(false);

  const ganttRef = useRef(null);
  const ACTIVITY_COL = 260;
  const MONTH_COL_W = 88;

  // ── Swimlane collapse ──
  const toggleCollapse = (id) => {
    setSwimlanes(prev => prev.map(s => s.id === id ? { ...s, collapsed: !s.collapsed } : s));
  };

  // ── Add Swimlane ──
  const addSwimlane = () => {
    setSwimlanes(prev => [...prev, {
      id: uid(), label: "New Swimlane", color: SWIMLANE_COLORS[prev.length % SWIMLANE_COLORS.length],
      collapsed: false, activities: []
    }]);
  };

  // ── Delete Swimlane ──
  const deleteSwimlane = (id) => setSwimlanes(prev => prev.filter(s => s.id !== id));

  // ── Rename Swimlane ──
  const renameSwimlane = (id, val) => setSwimlanes(prev => prev.map(s => s.id === id ? { ...s, label: val } : s));

  // ── Add Activity ──
  const addActivity = (swimId) => {
    setSwimlanes(prev => prev.map(s => s.id === swimId ? {
      ...s, activities: [...s.activities, {
        id: uid(), name: "New Activity", start: 0, duration: 2,
        color: COLORS[s.activities.length % COLORS.length], tags: [], notes: ""
      }]
    } : s));
  };

  // ── Delete Activity ──
  const deleteActivity = (swimId, actId) => {
    setSwimlanes(prev => prev.map(s => s.id === swimId ? { ...s, activities: s.activities.filter(a => a.id !== actId) } : s));
  };

  // ── Rename Activity ──
  const renameActivity = (swimId, actId, val) => {
    setSwimlanes(prev => prev.map(s => s.id === swimId ? { ...s, activities: s.activities.map(a => a.id === actId ? { ...a, name: val } : a) } : s));
  };

  // ── Move bar (drag left/right) ──
  const onBarMouseDown = (e, swimId, actId, act, mode) => {
    e.preventDefault();
    const startX = e.clientX;
    const origStart = act.start;
    const origDur = act.duration;
    const pxPerMonth = MONTH_COL_W;

    const onMove = (ev) => {
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
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── Add Month ──
  const addMonth = () => {
    if (newMonthLabel.trim()) {
      setMonths(prev => [...prev, { id: uid(), label: newMonthLabel.trim() }]);
      setNewMonthLabel("");
      setAddingMonth(false);
    }
  };

  // ── Remove Month ──
  const removeMonth = (idx) => {
    setMonths(prev => prev.filter((_, i) => i !== idx));
    if (goLiveIndex > idx) setGoLiveIndex(gi => gi - 1);
  };

  // ── Add Comment ──
  const addComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, { id: uid(), user: "You", avatar: "YO", text: newComment.trim(), time: "Just now", activityId: selectedActivity?.id || null }]);
    setNewComment("");
  };

  // ── Duplicate Swimlane ──
  const duplicateSwimlane = (sw) => {
    const newLane = {
      ...sw, id: uid(), label: sw.label + " (Copy)",
      activities: sw.activities.map(a => ({ ...a, id: uid() }))
    };
    setSwimlanes(prev => [...prev, newLane]);
  };

  // ── Resource loading summary per month ──
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
    <div style={{ background: "#0f0f1a", color: "#e2e8f0", minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", fontSize: 13, userSelect: "none" }}>
      {/* ── TOP BAR ── */}
      <div style={{ background: "#16162a", borderBottom: "1px solid #2a2a45", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📋</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>Scenario Planner</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Project Planning · Plan on a Page</div>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {/* Go-Live Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: goLiveLocked ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)", border: `1px solid ${goLiveLocked ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer" }} onClick={() => setShowSettings(true)}>
            {goLiveLocked ? <Lock size={13} color="#ef4444" /> : <Unlock size={13} color="#60a5fa" />}
            <span style={{ fontSize: 12, fontWeight: 600, color: goLiveLocked ? "#ef4444" : "#60a5fa" }}>Go-Live: {months[goLiveIndex]?.label || "—"}</span>
          </div>

          {/* Sites */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "5px 10px" }}>
            <MapPin size={13} color="#34d399" />
            <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>{sites.length} Sites</span>
          </div>

          {/* Teams */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 8, padding: "5px 10px" }}>
            <Users size={13} color="#a78bfa" />
            <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>{teams.length} Teams</span>
          </div>

          {/* Resource Panel Toggle */}
          <button onClick={() => setShowResourcePanel(p => !p)} style={{ background: showResourcePanel ? "rgba(245,158,11,0.15)" : "rgba(51,51,80,0.6)", border: `1px solid ${showResourcePanel ? "rgba(245,158,11,0.35)" : "#333"}`, color: showResourcePanel ? "#fbbf24" : "#94a3b8", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            📊 Resources
          </button>

          {/* Comments */}
          <button onClick={() => setShowComments(p => !p)} style={{ background: showComments ? "rgba(99,102,241,0.15)" : "rgba(51,51,80,0.6)", border: `1px solid ${showComments ? "rgba(99,102,241,0.35)" : "#333"}`, color: showComments ? "#a5b4fc" : "#94a3b8", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, position: "relative" }}>
            <MessageSquare size={13} /> Chat
            <span style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{comments.length}</span>
          </button>

          {/* Settings */}
          <button onClick={() => setShowSettings(p => !p)} style={{ background: "rgba(51,51,80,0.6)", border: "1px solid #333", color: "#94a3b8", borderRadius: 8, padding: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Settings size={15} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
        {/* ── MAIN GANTT AREA ── */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", position: "relative" }}>
          <div style={{ minWidth: ACTIVITY_COL + months.length * MONTH_COL_W + 120 }}>
            {/* ── MONTH HEADER ── */}
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#16162a", borderBottom: "1px solid #2a2a45", display: "flex", alignItems: "center" }}>
              <div style={{ width: ACTIVITY_COL, minWidth: ACTIVITY_COL, padding: "10px 16px", borderRight: "1px solid #2a2a45", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px" }}>Activities</span>
                <button onClick={addSwimlane} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
                  <Plus size={11} /> Lane
                </button>
              </div>
              {months.map((m, i) => (
                <div key={m.id} style={{ width: MONTH_COL_W, minWidth: MONTH_COL_W, textAlign: "center", padding: "10px 0", borderRight: "1px solid #2a2a3a", position: "relative", background: i === goLiveIndex ? "rgba(239,68,68,0.08)" : "transparent" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: i === goLiveIndex ? "#ef4444" : "#94a3b8" }}>{m.label}</div>
                  {i === goLiveIndex && <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700 }}>🎯 GO-LIVE</div>}
                  <button onClick={() => removeMonth(i)} style={{ position: "absolute", top: 2, right: 2, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 10, padding: 0, opacity: 0.5 }}
                    onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.5}>✕</button>
                </div>
              ))}
              {/* Add month */}
              <div style={{ width: 80, minWidth: 80, padding: "8px 4px", borderRight: "1px solid #2a2a3a" }}>
                {addingMonth ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <input autoFocus value={newMonthLabel} onChange={e => setNewMonthLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && addMonth()} placeholder="e.g. Mar 2026"
                      style={{ background: "#1e1e2e", border: "1px solid #444", color: "#fff", borderRadius: 4, padding: "3px 6px", fontSize: 11, width: "100%" }} />
                    <div style={{ display: "flex", gap: 3 }}>
                      <button onClick={addMonth} style={{ flex: 1, background: "#6366f1", border: "none", color: "#fff", borderRadius: 4, padding: "2px", cursor: "pointer", fontSize: 10 }}>✓</button>
                      <button onClick={() => setAddingMonth(false)} style={{ flex: 1, background: "#333", border: "none", color: "#fff", borderRadius: 4, padding: "2px", cursor: "pointer", fontSize: 10 }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingMonth(true)} style={{ background: "rgba(99,102,241,0.1)", border: "1px dashed rgba(99,102,241,0.4)", color: "#a5b4fc", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                    <Plus size={10} /> Month
                  </button>
                )}
              </div>
            </div>

            {/* ── RESOURCE LOAD BAR ── */}
            {showResourcePanel && (
              <div style={{ display: "flex", borderBottom: "1px solid #2a2a45", background: "#1a1a2e" }}>
                <div style={{ width: ACTIVITY_COL, minWidth: ACTIVITY_COL, padding: "8px 16px", borderRight: "1px solid #2a2a45" }}>
                  <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>📊 Resource Load</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Activities per month</div>
                </div>
                {months.map((m, i) => {
                  const load = resourceLoad[i];
                  const pct = (load / maxLoad) * 100;
                  const hue = load > maxLoad * 0.75 ? "#ef4444" : load > maxLoad * 0.5 ? "#f59e0b" : "#10b981";
                  return (
                    <div key={m.id} style={{ width: MONTH_COL_W, minWidth: MONTH_COL_W, borderRight: "1px solid #2a2a3a", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ background: "#1e1e2e", borderRadius: 4, height: 28, display: "flex", alignItems: "flex-end", overflow: "hidden", padding: "3px 0" }}>
                        <div style={{ width: "100%", height: `${pct}%`, background: hue, borderRadius: "3px 3px 0 0", transition: "height 0.3s", minHeight: load > 0 ? 4 : 0 }} />
                      </div>
                      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: hue }}>{load}</div>
                    </div>
                  );
                })}
                <div style={{ width: 80, minWidth: 80, borderRight: "1px solid #2a2a3a" }} />
              </div>
            )}

            {/* ── SWIMLANES & ACTIVITIES ── */}
            {swimlanes.map((sw, swIdx) => (
              <div key={sw.id} style={{ borderBottom: "1px solid #2a2a45" }}>
                {/* Swimlane Header */}
                <div style={{ display: "flex", alignItems: "center", background: `${sw.color}18`, borderBottom: "1px solid #2a2a3a" }}>
                  <div style={{ width: ACTIVITY_COL, minWidth: ACTIVITY_COL, padding: "7px 12px", borderRight: "1px solid #2a2a45", display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => toggleCollapse(sw.id)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0, display: "flex" }}>
                      {sw.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: sw.color }} />
                    <input value={sw.label} onChange={e => renameSwimlane(sw.id, e.target.value)}
                      style={{ background: "transparent", border: "none", color: "#f1f5f9", fontSize: 12, fontWeight: 700, flex: 1, outline: "none", minWidth: 0 }} />
                    <div style={{ display: "flex", gap: 3 }}>
                      <button onClick={() => duplicateSwimlane(sw)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 2 }}><Copy size={12} /></button>
                      <button onClick={() => deleteSwimlane(sw.id)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 2 }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  {months.map((m, i) => (
                    <div key={m.id} style={{ width: MONTH_COL_W, minWidth: MONTH_COL_W, height: 30, borderRight: "1px solid #2a2a3a", background: i === goLiveIndex ? "rgba(239,68,68,0.04)" : "transparent" }} />
                  ))}
                  <div style={{ width: 80, minWidth: 80, borderRight: "1px solid #2a2a3a" }} />
                </div>

                {/* Activities */}
                {!sw.collapsed && (
                  <>
                    {sw.activities.map((act) => (
                      <div key={act.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1e1e2e", minHeight: 40 }}>
                        {/* Activity Name Cell */}
                        <div style={{ width: ACTIVITY_COL, minWidth: ACTIVITY_COL, padding: "6px 12px 6px 28px", borderRight: "1px solid #2a2a45", display: "flex", alignItems: "center", gap: 8, background: selectedActivity?.id === act.id ? "rgba(99,102,241,0.08)" : "#0f0f1a" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: act.color }} />
                          <input value={act.name} onChange={e => renameActivity(sw.id, act.id, e.target.value)}
                            style={{ background: "transparent", border: "none", color: "#cbd5e1", fontSize: 12, flex: 1, outline: "none", minWidth: 0 }} />
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            {act.tags.map(t => <Tag key={t} label={t} />)}
                            <button onClick={() => setSelectedActivity(selectedActivity?.id === act.id ? null : act)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 1 }}>
                              <MessageSquare size={11} />
                            </button>
                            <button onClick={() => deleteActivity(sw.id, act.id)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 1 }}><Trash2 size={11} /></button>
                          </div>
                        </div>

                        {/* Gantt Cells */}
                        <div style={{ position: "relative", display: "flex", flex: 1 }}>
                          {months.map((m, i) => (
                            <div key={m.id} style={{ width: MONTH_COL_W, minWidth: MONTH_COL_W, height: 40, borderRight: "1px solid #1e1e2e", background: i === goLiveIndex ? "rgba(239,68,68,0.03)" : "transparent" }} />
                          ))}

                          {/* Activity Bar */}
                          <div style={{
                            position: "absolute", top: 6, height: 28, borderRadius: 6,
                            left: act.start * MONTH_COL_W, width: act.duration * MONTH_COL_W - 2,
                            background: `linear-gradient(90deg, ${act.color}, ${act.color}cc)`,
                            boxShadow: `0 2px 8px ${act.color}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "grab", zIndex: 2, transition: "box-shadow 0.2s",
                          }}
                            onMouseDown={(e) => onBarMouseDown(e, sw.id, act.id, act, "move")}
                            onClick={() => { setSelectedActivity(act); setShowComments(true); }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 14px ${act.color}60, inset 0 1px 0 rgba(255,255,255,0.2)`}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = `0 2px 8px ${act.color}40, inset 0 1px 0 rgba(255,255,255,0.15)`}
                          >
                            <span style={{ fontSize: 10, color: "#fff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%", textAlign: "center", pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                              {act.duration >= 2 ? act.name : ""}
                            </span>
                            {/* Resize Handle */}
                            <div style={{
                              position: "absolute", right: 0, top: 0, bottom: 0, width: 6, cursor: "e-resize", zIndex: 3,
                              borderRadius: "0 6px 6px 0", display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                              onMouseDown={(e) => { e.stopPropagation(); onBarMouseDown(e, sw.id, act.id, act, "resize"); }}
                            >
                              <div style={{ width: 2, height: 14, background: "rgba(255,255,255,0.5)", borderRadius: 1 }} />
                            </div>
                          </div>

                          {/* Comment indicator dots */}
                          {comments.filter(c => c.activityId === act.id).length > 0 && (
                            <div style={{ position: "absolute", top: 1, left: act.start * MONTH_COL_W + 4, zIndex: 3 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #0f0f1a" }} />
                            </div>
                          )}
                        </div>
                        <div style={{ width: 80, minWidth: 80 }} />
                      </div>
                    ))}

                    {/* Add Activity Row */}
                    <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1e1e2e" }}>
                      <div style={{ width: ACTIVITY_COL, minWidth: ACTIVITY_COL, padding: "5px 12px 5px 28px", borderRight: "1px solid #2a2a45" }}>
                        <button onClick={() => addActivity(sw.id)} style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.35)", color: "#7c8adb", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 11, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontWeight: 600 }}>
                          <Plus size={11} /> Add Activity
                        </button>
                      </div>
                      <div style={{ flex: 1, height: 34, display: "flex" }}>
                        {months.map((m) => <div key={m.id} style={{ width: MONTH_COL_W, minWidth: MONTH_COL_W, borderRight: "1px solid #1e1e2e" }} />)}
                      </div>
                      <div style={{ width: 80, minWidth: 80 }} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL (Comments / Settings) ── */}
        {(showComments || showSettings) && (
          <div style={{ width: 340, minWidth: 340, background: "#16162a", borderLeft: "1px solid #2a2a45", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {/* Panel Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #2a2a45" }}>
              <button onClick={() => { setShowComments(true); setShowSettings(false); }} style={{ flex: 1, background: showComments && !showSettings ? "rgba(99,102,241,0.12)" : "transparent", border: "none", color: showComments && !showSettings ? "#a5b4fc" : "#64748b", padding: "10px", cursor: "pointer", fontSize: 12, fontWeight: 600, borderBottom: showComments && !showSettings ? "2px solid #6366f1" : "2px solid transparent" }}>
                💬 Collaboration
              </button>
              <button onClick={() => { setShowSettings(true); setShowComments(false); }} style={{ flex: 1, background: showSettings ? "rgba(99,102,241,0.12)" : "transparent", border: "none", color: showSettings ? "#a5b4fc" : "#64748b", padding: "10px", cursor: "pointer", fontSize: 12, fontWeight: 600, borderBottom: showSettings ? "2px solid #6366f1" : "2px solid transparent" }}>
                ⚙️ Settings
              </button>
            </div>

            {/* ── COLLABORATION TAB ── */}
            {showComments && !showSettings && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {selectedActivity && (
                  <div style={{ padding: "10px 16px", background: "rgba(99,102,241,0.08)", borderBottom: "1px solid #2a2a45" }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Commenting on:</div>
                    <div style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 600 }}>{selectedActivity.name}</div>
                  </div>
                )}
                <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
                  {comments.filter(c => !selectedActivity || c.activityId === selectedActivity.id || !c.activityId).map(c => {
                    const linkedAct = swimlanes.flatMap(s => s.activities).find(a => a.id === c.activityId);
                    return (
                      <div key={c.id} style={{ marginBottom: 14, padding: "10px 12px", background: "#1a1a2e", borderRadius: 8, border: "1px solid #2a2a3a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <Avatar initials={c.avatar} size={26} color={c.user === "You" ? "#6366f1" : "#3b82f6"} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{c.user}</span>
                            <span style={{ fontSize: 10, color: "#64748b", marginLeft: 8 }}>{c.time}</span>
                          </div>
                        </div>
                        {linkedAct && <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>📌 {linkedAct.name}</div>}
                        <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{c.text}</div>
                        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                          <button style={{ background: "none", border: "none", color: "#64748b", fontSize: 11, cursor: "pointer", padding: 0 }}>👍 Reply</button>
                          <button style={{ background: "none", border: "none", color: "#64748b", fontSize: 11, cursor: "pointer", padding: 0 }}>🔗 Link</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Comment Input */}
                <div style={{ padding: 16, borderTop: "1px solid #2a2a45" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <Avatar initials="YO" size={28} color="#6366f1" />
                    <div style={{ flex: 1 }}>
                      <textarea value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                        placeholder={selectedActivity ? `Comment on "${selectedActivity.name}"...` : "Add a comment..."}
                        rows={2} style={{ width: "100%", background: "#1e1e2e", border: "1px solid #333", color: "#e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box" }} />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                        <button onClick={addComment} style={{ background: "#6366f1", border: "none", color: "#fff", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Post</button>
                      </div>
                    </div>
                  </div>
                  {/* Active users */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
                    <span style={{ fontSize: 10, color: "#64748b" }}>Active:</span>
                    {[{ i: "SK", c: "#3b82f6" }, { i: "JM", c: "#8b5cf6" }, { i: "YO", c: "#6366f1" }].map((u, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <Avatar initials={u.i} size={22} color={u.c} />
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 7, height: 7, borderRadius: "50%", background: "#10b981", border: "2px solid #16162a" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {showSettings && (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Go-Live Settings */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>🎯 Go-Live Configuration</div>
                  <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <label style={{ fontSize: 11, color: "#94a3b8", width: 70 }}>Target</label>
                      <select value={goLiveIndex} onChange={e => setGoLiveIndex(Number(e.target.value))}
                        style={{ flex: 1, background: "#1e1e2e", border: "1px solid #333", color: "#fff", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none" }}>
                        {months.map((m, i) => <option key={m.id} value={i}>{m.label}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <label style={{ fontSize: 11, color: "#94a3b8", width: 70 }}>Lock</label>
                      <button onClick={() => setGoLiveLocked(p => !p)} style={{ display: "flex", alignItems: "center", gap: 6, background: goLiveLocked ? "rgba(239,68,68,0.15)" : "rgba(51,51,80,0.6)", border: `1px solid ${goLiveLocked ? "rgba(239,68,68,0.3)" : "#444"}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: goLiveLocked ? "#ef4444" : "#94a3b8", fontSize: 12, fontWeight: 600 }}>
                        {goLiveLocked ? <><Lock size={12} /> Locked (Fixed)</> : <><Unlock size={12} /> Unlocked</>}
                      </button>
                    </div>
                    {goLiveLocked && <div style={{ fontSize: 10, color: "#f59e0b", background: "rgba(245,158,11,0.1)", borderRadius: 6, padding: "6px 8px", display: "flex", alignItems: "center", gap: 5 }}>
                      <AlertTriangle size={11} /> Activities beyond Go-Live will be flagged
                    </div>}
                  </div>
                </div>

                {/* Sites */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    📍 Sites / Locations
                    <button onClick={() => setSites(p => [...p, { id: uid(), name: "New Site", region: "—" }])} style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 11 }}><Plus size={10} /> Add</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {sites.map((s, i) => (
                      <div key={s.id} style={{ background: "#1a1a2e", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                        <MapPin size={13} color="#34d399" />
                        <input value={s.name} onChange={e => setSites(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                          style={{ flex: 1, background: "transparent", border: "none", color: "#cbd5e1", fontSize: 12, outline: "none" }} />
                        <span style={{ fontSize: 10, color: "#64748b" }}>{s.region}</span>
                        <button onClick={() => setSites(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Teams */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    👥 Teams
                    <button onClick={() => setTeams(p => [...p, { id: uid(), name: "New Team", location: "—", color: COLORS[p.length % COLORS.length] }])} style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 11 }}><Plus size={10} /> Add</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {teams.map((t, i) => (
                      <div key={t.id} style={{ background: "#1a1a2e", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} />
                        <input value={t.name} onChange={e => setTeams(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                          style={{ flex: 1, background: "transparent", border: "none", color: "#cbd5e1", fontSize: 12, outline: "none" }} />
                        <span style={{ fontSize: 10, color: "#64748b" }}>{t.location}</span>
                        <button onClick={() => setTeams(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scenario Snapshots */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>📸 Scenario Snapshots</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {["Baseline Plan", "Aggressive Timeline", "Conservative"].map((name, i) => (
                      <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: ["#10b981", "#f59e0b", "#60a5fa"][i] }} />
                        <span style={{ fontSize: 12, color: "#cbd5e1", flex: 1 }}>{name}</span>
                        <span style={{ fontSize: 10, color: "#64748b" }}>{["Active", "Saved", "Saved"][i]}</span>
                      </div>
                    ))}
                    <button style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.35)", color: "#7c8adb", borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Plus size={11} /> Save Current as Snapshot
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
