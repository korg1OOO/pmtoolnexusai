import { motion } from 'framer-motion';
import {
    BrainCircuit,
    GanttChartSquare,
    Share2,
    LineChart,
    ShieldCheck,
    Users,
    Sparkles,
    Zap,
    MessageSquareText
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        viewport={{ once: true }}
        className="p-6 rounded-2xl bg-card border border-border/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300 group"
    >
        <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-6 w-6 text-indigo-500" />
        </div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
);

export const FeaturesSection = () => {
    const features = [
        {
            icon: BrainCircuit,
            title: "AI Orchestration",
            description: "Automated project intelligence that predicts risks, suggests optimizations, and drafts briefings."
        },
        {
            icon: GanttChartSquare,
            title: "Advanced Planning",
            description: "Enterprise-grade timeline management with auto-scheduling, critical path analysis, and resource leveling."
        },
        {
            icon: MessageSquareText,
            title: "Smart Meetings",
            description: "Transcribe, summarize, and extract action items from meetings automatically using our specialized AI models."
        },
        {
            icon: LineChart,
            title: "Real-time Analytics",
            description: "Live EVM metrics, burn-down charts, and financial tracking dashboards for complete visibility."
        },
        {
            icon: ShieldCheck,
            title: "Full Traceability",
            description: "End-to-end requirement tracing ensuring every deliverable maps back to business needs and compliance rules."
        },
        {
            icon: Users,
            title: "Team Collaboration",
            description: "Context-aware chat, document co-editing, and role-based workflows designed for complex teams."
        }
    ];

    return (
        <section id="features" className="py-24 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6"
                    >
                        <Zap size={12} />
                        <span>Powerful Capabilities</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="text-4xl md:text-5xl font-black tracking-tight mb-6"
                    >
                        Everything you need to <span className="text-indigo-500">deliver</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-xl text-muted-foreground font-medium"
                    >
                        ProjectOye combines traditional project management rigor with cutting-edge AI to help you build faster and better.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <FeatureCard
                            key={idx}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                            delay={idx * 0.1}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
