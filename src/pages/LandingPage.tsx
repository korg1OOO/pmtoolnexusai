import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalAISidebar } from '@/components/ai/GlobalAISidebar';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

import { supabase } from '@/integrations/supabase/client';

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
    <section id="pricing" className="min-h-screen w-full snap-start relative flex flex-col items-center justify-center overflow-hidden bg-background sticky top-0 border-t border-white/5 py-20">

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

export default function LandingPage() {
    const [showAISidebar, setShowAISidebar] = React.useState(false);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

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

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleHomeClick = () => {
        scrollToSection('hero');
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

            <div
                ref={containerRef}
                className={cn(
                    "h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth transition-all duration-300",
                    showAISidebar && "mr-96"
                )}
            >
                {/* 0. Hero */}
                <HeroSection onStartClick={() => navigate('/product-tour')} />

                {/* 1. Features */}
                <div id="features" className="snap-start min-h-screen flex flex-col justify-center">
                    <FeaturesSection />
                </div>

                {/* 2. Pricing */}
                <div id="pricing" className="snap-start">
                    <PricingSection />
                </div>

                <LandingFooter />
            </div>
        </div>
    );
}
