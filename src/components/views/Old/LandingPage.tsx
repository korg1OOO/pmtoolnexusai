import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Zap,
    Brain,
    Layers,
    Kanban,
    Clock,
    Shield,
    BarChart3,
    ChevronRight,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { LandingHeader } from '@/components/layout/LandingHeader';

const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'Intelligence', href: '#ai' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Blog', href: '/blog' },
];

const features = [
    {
        icon: Kanban,
        title: "Kanban Redefined",
        description: "Experience fluid, high-performance boards designed for modern product teams.",
        color: "bg-blue-500/10 text-blue-500"
    },
    {
        icon: Brain,
        title: "AI Forecasting",
        description: "Predict sprint risks and delivery timelines with machine learning intelligence.",
        color: "bg-purple-500/10 text-purple-500"
    },
    {
        icon: Zap,
        title: "Instant Setup",
        description: "Zero-config project instantiation with 15+ industry-vetted templates.",
        color: "bg-amber-500/10 text-amber-500"
    },
    {
        icon: BarChart3,
        title: "Deep Analytics",
        description: "From EVM metrics to velocity charts, get crystal clear visibility into performance.",
        color: "bg-emerald-500/10 text-emerald-500"
    },
    {
        icon: Shield,
        title: "Enterprise Governance",
        description: "Granular RBAC and stage-gate approvals for complex portfolio management.",
        color: "bg-rose-500/10 text-rose-500"
    },
    {
        icon: Clock,
        title: "Resource Mastery",
        description: "Optimize team utilization and track burn rate in real-time.",
        color: "bg-indigo-500/10 text-indigo-500"
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            <LandingHeader />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                <div className="container mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary">
                            <Sparkles className="h-3.5 w-3.5 mr-2" />
                            Introducing ProjectOye 2.0
                        </Badge>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text"
                    >
                        Project Management,<br />
                        <span className="text-primary">Evolved through AI.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed mb-10"
                    >
                        The world's first AI-native PM Operating System. Automate governance,
                        predict risks, and ship high-impact projects with precision.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/20 group" asChild>
                            <Link to="/login">
                                Launch ProjectOye
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-full border-2 bg-background/50 backdrop-blur-sm" asChild>
                            <Link to="/login">View Demo</Link>
                        </Button>
                    </motion.div>
                </div>

                {/* Hero Illustration / Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="container mx-auto px-6 mt-20"
                >
                    <div className="relative mx-auto max-w-6xl aspect-[16/10] bg-gradient-to-br from-card to-card/50 rounded-2xl border shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
                        <div className="absolute top-0 left-0 right-0 h-10 border-b bg-muted/30 backdrop-blur-md flex items-center px-4 gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-rose-500/30" />
                            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/30" />
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/30" />
                        </div>
                        {/* Visual representation of the dashboard */}
                        <div className="p-12 pt-16 grid grid-cols-3 gap-8 h-full">
                            <div className="col-span-2 space-y-6">
                                <div className="h-40 rounded-xl bg-primary/5 border border-primary/10 animate-pulse" />
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="h-64 rounded-xl bg-muted/20 border border-border" />
                                    <div className="h-64 rounded-xl bg-muted/20 border border-border" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="h-2/3 rounded-xl bg-primary/10 border border-primary/20 flex flex-col p-6 items-center justify-center gap-4 text-center">
                                    <Brain className="h-12 w-12 text-primary" />
                                    <div>
                                        <div className="text-sm font-bold text-primary mb-1">AI INSIGHT</div>
                                        <div className="text-xs text-muted-foreground leading-relaxed">System predicts 92% project health. One milestone at risk due to resource bottleneck.</div>
                                    </div>
                                    <Button size="sm" className="w-full text-[10px] h-8 rounded-lg mt-4">Resolve automatically</Button>
                                </div>
                                <div className="h-1/3 rounded-xl bg-muted/20 border border-border" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 bg-muted/10 border-y">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mb-16">
                        <h2 className="text-4xl font-bold tracking-tight mb-4">Engineered for Success.</h2>
                        <p className="text-xl text-muted-foreground">Every tool you need to plan, execute, and govern high-stakes enterprise projects.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card className="group h-full border-transparent hover:border-primary/20 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5">
                                    <CardContent className="p-8">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform`}>
                                            <feature.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Intelligence Section */}
            <section id="ai" className="py-32">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-6">
                                <Brain className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">AI that works as hard as you do.</h2>
                            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                                ProjectOye doesn't just display data—it understands it. Our native AI engines analyze your project graph in real-time to alert you of risks before they become issues.
                            </p>

                            <div className="space-y-6">
                                {[
                                    { title: "Smart Resource Allocation", desc: "AI identifies over-utilized team members and suggests better allocation paths." },
                                    { title: "Risk Mitigation Engine", desc: "Automated logic to identify critical path delays and suggest mitigation tasks." },
                                    { title: "Conversational Intelligence", desc: "Ask our project agent anything about your status, budget, or timelines." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold mb-1">{item.title}</h4>
                                            <p className="text-muted-foreground text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button className="mt-12 rounded-full h-12 px-8" asChild>
                                <Link to="/login">Explore AI Intelligence</Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative aspect-square"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl animate-pulse" />
                            <div className="absolute inset-4 bg-background/40 backdrop-blur-xl rounded-2xl border shadow-2xl overflow-hidden p-10 flex flex-col justify-center gap-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                        <div className="h-2 w-32 rounded-full bg-muted" />
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted" />
                                    <div className="h-2 w-2/3 rounded-full bg-muted" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-full bg-rose-500" />
                                        <div className="h-2 w-32 rounded-full bg-muted" />
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted" />
                                    <div className="h-2 w-3/4 rounded-full bg-muted" />
                                    <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-500 font-bold">
                                        CRITICAL ALERT: Resource "Sarah Chen" is 140% allocated for Sprint 4.
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32">
                <div className="container mx-auto px-6">
                    <div className="rounded-3xl bg-foreground text-background p-12 md:p-24 text-center overflow-hidden relative">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,var(--primary),transparent)]" />

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-bold tracking-tight mb-8 relative z-10"
                        >
                            Ready to ship<br />faster?
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="mx-auto max-w-xl text-lg text-background/60 mb-10 relative z-10"
                        >
                            Join 500+ forward-thinking teams using ProjectOye to build the future of enterprise delivery.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg rounded-full" asChild>
                                <Link to="/login">Get Started Free</Link>
                            </Button>
                            <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-full border-muted-foreground/30 hover:bg-background hover:text-foreground" asChild>
                                <Link to="/contact">Contact Sales</Link>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            <LandingFooter />
        </div>
    );
}
