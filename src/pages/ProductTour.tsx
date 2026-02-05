import React, { useRef } from 'react';
import { TimelinePlannerTab } from '@/components/views/TimelinePlannerTab';
import { PlanningView } from '@/components/views/PlanningView';
import { MorningBriefingView } from '@/components/views/MorningBriefingView';
import { ReportsView } from '@/components/views/ReportsView';
import { TraceabilityMatrixView } from '@/components/views/TraceabilityMatrixView';
import { EnhancedMeetingsView } from '@/components/views/EnhancedMeetingsView';
import { NotesView } from '@/components/views/NotesView';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingFooter } from '@/components/layout/LandingFooter';

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
                        <h2 className="text-4xl font-black tracking-tight mb-2 drop-shadow-sm">{title}</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl font-medium">{description}</p>
                    </motion.div>
                </div>

                {/* Content Container */}
                <div className="w-full h-full pt-60 pb-8 px-6 md:pl-32 md:pr-12 overflow-hidden flex flex-col">
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

export default function ProductTour() {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToSection = (index: number) => {
        const id = `section-${index}`;
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="relative bg-black text-foreground h-screen overflow-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 z-[100] flex items-center justify-between px-8">
                <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={16} />
                    <span className="text-sm font-medium">Back to Home</span>
                </a>
                <span className="text-lg font-bold tracking-tight text-foreground">ProjectOye Product Tour</span>
                <div className="w-20" /> {/* Spacer for centering */}
            </header>

            <div
                ref={containerRef}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth pt-16"
            >
                {/* 1. Timeline Planner */}
                <div id="section-1" className="snap-start">
                    <Section
                        title="Enterprise Orchestration"
                        description="Visualize and manage complex multi-year programs with our advanced Timeline Planner. Drag, drop, and lock your critical path."
                        color="from-indigo-500/20 via-blue-500/5"
                        onNextClick={() => scrollToSection(2)}
                    >
                        <TimelinePlannerTab />
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
                    >
                        <NotesView demo={true} />
                    </Section>
                </div>

                <LandingFooter />
            </div>
        </div>
    );
}
