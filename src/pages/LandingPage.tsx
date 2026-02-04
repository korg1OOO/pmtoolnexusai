import React, { useRef } from 'react';
import { TimelinePlannerTab } from '@/components/views/TimelinePlannerTab';
import { PlanningView } from '@/components/views/PlanningView';
import { MorningBriefingView } from '@/components/views/MorningBriefingView';
import { ReportsView } from '@/components/views/ReportsView';
import { TraceabilityMatrixView } from '@/components/views/TraceabilityMatrixView';
import { EnhancedMeetingsView } from '@/components/views/EnhancedMeetingsView';
import { NotesView } from '@/components/views/NotesView';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ChevronDown, Rocket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalAISidebar } from '@/components/ai/GlobalAISidebar';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';

import { supabase } from '@/integrations/supabase/client';

const Section = ({
    children,
    title,
    description,
    color = "from-indigo-500/10 to-purple-500/10",
    onNextClick
}: {
    children: React.ReactNode;
    title: string;
    description: string;
    color?: string;
    onNextClick?: () => void;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    // Animation: Scale down and fade out as user scrolls past this section
    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]); // Subtle shrink
    const opacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0]); // Fade out later
    const borderRadius = useTransform(scrollYProgress, [0, 1], ["0px", "24px"]);

    // Smooth spring for better feel
    const smoothScale = useSpring(scale, { stiffness: 100, damping: 20 });

    return (
        <section ref={ref} className="h-screen w-full snap-start relative flex flex-col overflow-hidden bg-background sticky top-0">
            <motion.div
                style={{ scale: smoothScale, opacity, borderRadius }}
                className="w-full h-full bg-background overflow-hidden relative shadow-2xl origin-top"
            >
                {/* Header Overlay */}
                <div className={`absolute top-0 left-0 right-0 z-50 p-8 pt-24 bg-gradient-to-b ${color} from-10% to-transparent pointer-events-none`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full px-6 md:px-12 flex flex-col items-start text-left"
                    >
                        <div className="inline-block px-3 py-1 mb-2 text-xs font-bold uppercase tracking-widest rounded-full bg-background/50 border border-border backdrop-blur-md text-foreground/80">
                            Product Tour
                        </div>
                        <h2 className="text-4xl font-black tracking-tight mb-2 drop-shadow-sm">{title}</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl font-medium">{description}</p>
                    </motion.div>
                </div>

                {/* Content Container */}
                <div className="w-full h-full pt-60 pb-8 px-6 md:pl-32 md:pr-12 overflow-hidden flex flex-col">
                    {/* Added explicit border color and shadow for 'light border' request */}
                    <div className="w-full flex-1 rounded-xl border-2 border-muted/60 shadow-xl bg-card overflow-hidden relative group">
                        {children}
                    </div>
                </div>

                {/* Scroll Indicator */}
                {onNextClick && (
                    <button
                        onClick={onNextClick}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 animate-bounce cursor-pointer border-2 border-white/20"
                        aria-label="Next Section"
                    >
                        <ChevronDown size={24} />
                    </button>
                )}
            </motion.div>
        </section>
    );
};

const HeroSection = ({ onStartClick }: { onStartClick: () => void }) => (
    <section id="hero" className="h-screen w-full snap-start relative flex flex-col items-center justify-center overflow-hidden bg-slate-950">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

        <div className="z-10 text-center space-y-8 px-4 max-w-5xl mx-auto relative">
            {/* Glow effect behind text */}
            <div className="absolute -inset-x-20 -top-20 -bottom-20 bg-indigo-500/20 blur-[100px] rounded-full opacity-50 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-sm">
                    <Sparkles size={12} />
                    <span>Reimagining Project Management</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-white drop-shadow-2xl">
                    Enterprise
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-pulse">Orchestration.</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                    The intelligence layer for complex programs. Visualize, plan, and execute with AI-driven precision.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col md:flex-row items-center justify-center gap-4 relative z-20"
            >
                <Button size="lg" className="h-16 px-10 text-xl rounded-full gap-3 bg-white text-indigo-950 hover:bg-indigo-50 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 font-bold" onClick={onStartClick}>
                    <Rocket size={24} className="text-indigo-600" /> Start Product Tour
                </Button>
            </motion.div>
        </div>

        {/* Hero Visual Elements - Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
    </section>
);

const PricingSection = () => (
    <section id="pricing" className="h-screen w-full snap-start relative flex flex-col items-center justify-center overflow-hidden bg-background sticky top-0 border-t border-white/5">

        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-50 p-8 pt-24 bg-gradient-to-b from-indigo-500/10 to-purple-500/10 from-10% to-transparent pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full px-6 md:px-12 flex flex-col items-start text-left"
            >
                <div className="inline-block px-3 py-1 mb-2 text-xs font-bold uppercase tracking-widest rounded-full bg-background/50 border border-border backdrop-blur-md text-foreground/80">
                    Pricing
                </div>
                <h2 className="text-4xl font-black tracking-tight mb-2 drop-shadow-sm">Transparent Pricing</h2>
                <p className="text-muted-foreground text-lg max-w-2xl font-medium">Simple, predictable pricing for teams of all sizes.</p>
            </motion.div>
        </div>

        <div className="z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 pt-32">
            {[
                { name: "Starter", price: "$0", desc: "For independent consultants", features: ["Single Project", "Basic Timeline", "7-day History"] },
                { name: "Pro", price: "$49", desc: "For growing teams", features: ["Unlimited Projects", "AI Insights", "Full Traceability", "Priority Support"], popular: true },
                { name: "Enterprise", price: "Custom", desc: "For global organizations", features: ["SAML SSO", "On-Premise Option", "Dedicated Success Manager", "SLA Guarantee"] }
            ].map((plan, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-8 rounded-3xl border flex flex-col relative group hover:scale-105 transition-all duration-500 ${plan.popular ? 'bg-indigo-950/20 border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.1)]' : 'bg-card/50 border-white/10 hover:border-white/20'}`}
                >
                    {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg">Most Popular</div>}
                    <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <div className="text-4xl font-black text-foreground mb-1">{plan.price}<span className="text-base font-medium text-muted-foreground">/mo</span></div>
                    <p className="text-sm text-muted-foreground mb-8">{plan.desc}</p>
                    <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {f}
                            </li>
                        ))}
                    </ul>
                    <Button className={`w-full h-12 rounded-xl font-bold ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-500' : 'variant-outline'}`}>
                        Choose {plan.name}
                    </Button>
                </motion.div>
            ))}
        </div>
    </section>
);

const Sidebar = ({ sections, activeIndex, onNavigate }: { sections: string[], activeIndex: number, onNavigate: (idx: number) => void }) => (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4">
        {sections.map((label, idx) => (
            <div key={idx} className="group flex items-center gap-4 cursor-pointer" onClick={() => onNavigate(idx)}>
                <div className={`h-2 w-2 rounded-full transition-all duration-300 ${activeIndex === idx ? 'bg-indigo-500 scale-125 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-300 origin-left ${activeIndex === idx ? 'text-indigo-500 opacity-100 translate-x-0' : 'text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                    {label}
                </span>
            </div>
        ))}
    </div>
);

export default function LandingPage() {
    const [showAISidebar, setShowAISidebar] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState(0);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Check initial auth state
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const sections = [
        "Hero",
        "Orchestration",
        "Planning",
        "Briefings",
        "Analytics",
        "Traceability",
        "Meetings",
        "Notes",
        "Pricing"
    ];

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollPosition = e.currentTarget.scrollTop;
        const windowHeight = window.innerHeight;
        const currentSection = Math.round(scrollPosition / windowHeight);
        if (currentSection !== activeSection) {
            setActiveSection(currentSection);
        }
    };

    const scrollToSection = (index: number) => {
        const id = index === 0 ? 'hero' : `section-${index}`;
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else if (index === 0) {
            // Fallback for Hero if ID not found, though it should be there
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleHomeClick = () => {
        const scrollTop = containerRef.current?.scrollTop || 0;
        if (scrollTop < 50) {
            window.location.reload();
        } else {
            scrollToSection(0);
        }
    };

    return (
        <div className="relative bg-black text-foreground h-screen overflow-hidden">
            <LandingHeader onLogoClick={handleHomeClick} isAuthenticated={isAuthenticated} />

            {/* AI Assistant Sidebar - Integrated directly */}
            <GlobalAISidebar
                isOpen={showAISidebar}
                onToggle={() => setShowAISidebar(!showAISidebar)}
                projectId={null}
                projectName="Project Oye"
                currentView="landing"
            />

            <Sidebar sections={sections} activeIndex={activeSection} onNavigate={scrollToSection} />

            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
            >
                {/* 0. Hero */}
                <HeroSection onStartClick={() => scrollToSection(1)} />

                {/* 1. Timeline Planner */}
                <div id="section-1" className="snap-start">
                    <Section
                        title="Enterprise Orchestration"
                        description="Visualize and manage complex multi-year programs with our advanced Timeline Planner. Drag, drop, and lock your critical path."
                        color="from-indigo-500/20 via-blue-500/5"
                        onNextClick={() => scrollToSection(2)}
                    >
                        <TimelinePlannerTab demo={true} />
                    </Section>
                </div>

                {/* 2. Project Plan */}
                <div id="section-2" className="snap-start">
                    <Section
                        title="Strategic Planning"
                        description="Build comprehensive project plans with automated WBS, resource allocation, and dependency management."
                        color="from-emerald-500/20 via-teal-500/5"
                        onNextClick={() => scrollToSection(3)}
                    >
                        <PlanningView demo={true} />
                    </Section>
                </div>

                {/* 3. Morning Briefing */}
                <div id="section-3" className="snap-start">
                    <Section
                        title="Intelligent Briefings"
                        description="Start your day with AI-curated insights. See critical alerts, schedule slippage, and team health at a glance."
                        color="from-amber-500/20 via-orange-500/5"
                        onNextClick={() => scrollToSection(4)}
                    >
                        <MorningBriefingView demo={true} />
                    </Section>
                </div>

                {/* 4. Reports */}
                <div id="section-4" className="snap-start">
                    <Section
                        title="Advanced Analytics"
                        description="Real-time reporting on EVM metrics, financial health, and portfolio performance."
                        color="from-rose-500/20 via-red-500/5"
                        onNextClick={() => scrollToSection(5)}
                    >
                        <ReportsView />
                    </Section>
                </div>

                {/* 5. Traceability */}
                <div id="section-5" className="snap-start">
                    <Section
                        title="Full Traceability"
                        description="Maintain a golden thread from requirements to deliverables, ensuring compliance and scope control."
                        color="from-cyan-500/20 via-sky-500/5"
                        onNextClick={() => scrollToSection(6)}
                    >
                        <TraceabilityMatrixView demo={true} />
                    </Section>
                </div>

                {/* 6. Meetings */}
                <div id="section-6" className="snap-start">
                    <Section
                        title="Intelligent Meetings"
                        description="AI-enhanced meeting management with automated minutes, decision tracking, and sentiment analysis."
                        color="from-violet-500/20 via-fuchsia-500/5"
                        onNextClick={() => scrollToSection(7)}
                    >
                        <EnhancedMeetingsView demo={true} />
                    </Section>
                </div>

                {/* 7. Notes */}
                <div id="section-7" className="snap-start">
                    <Section
                        title="Smart Documentation"
                        description="Collaborative notes and documentation that link directly to your project artifacts and decisions."
                        color="from-pink-500/20 via-rose-500/5"
                        onNextClick={() => scrollToSection(8)}
                    >
                        <NotesView demo={true} />
                    </Section>
                </div>

                {/* 8. Pricing */}
                <div id="section-8" className="snap-start">
                    <PricingSection />
                </div>
            </div>

            <LandingFooter />
        </div>
    );
}
