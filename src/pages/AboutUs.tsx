import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rocket, Users, Globe, Shield } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-black text-foreground">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 z-[100] flex items-center justify-between px-8">
                <div className="flex items-center gap-2">
                    <a href="/" className="hover:opacity-80 transition-opacity">
                        <span className="text-lg font-bold tracking-tight">ProjectOye</span>
                    </a>
                </div>
                <a href="/">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft size={16} /> Back to Home
                    </Button>
                </a>
            </header>

            <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto space-y-20">

                {/* Hero Section */}
                <section className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full mb-4">
                        <Rocket className="text-indigo-400 h-8 w-8" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                        We orchestrate the future.
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        ProjectOye was born from a simple belief: Complex programs shouldn't be chaotic. We build intelligence layers for the world's most ambitious teams.
                    </p>
                </section>

                {/* Values Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-indigo-500/50 transition-colors group">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Globe className="text-blue-400 h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Global Scale</h3>
                        <p className="text-muted-foreground">Designed for enterprises that span continents. Seamless collaboration across time zones and cultures.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-purple-500/50 transition-colors group">
                        <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Users className="text-purple-400 h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Human Centric</h3>
                        <p className="text-muted-foreground">Technology should empower people, not replace them. We amplify human intelligence with AI.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-emerald-500/50 transition-colors group">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Shield className="text-emerald-400 h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Uncompromising Trust</h3>
                        <p className="text-muted-foreground">Your data is your most valuable asset. Security and privacy are baked into our DNA from day one.</p>
                    </div>
                </section>

                {/* Story Section */}
                <section className="bg-slate-900/50 rounded-3xl p-8 md:p-12 border border-white/10">
                    <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                    <div className="space-y-6 text-lg text-slate-300 leading-relaxed font-light">
                        <p>
                            In 2024, a group of program managers and AI engineers realized that despite the explosion of productivity tools, managing large-scale enterprise portfolios was still largely done on spreadsheets and disconnected slides.
                        </p>
                        <p>
                            The "intelligence gap" was widening. Decisions were made on stale data, and risks were identified only after they became issues.
                        </p>
                        <p>
                            We built ProjectOye to close that gap. By combining rigorous project management standards with cutting-edge Generative AI, we've created a platform that doesn't just track work—it helps you understand it.
                        </p>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-white/10 text-center text-muted-foreground">
                <p>© 2026 ProjectOye Inc. Building the future of work.</p>
            </footer>
        </div>
    );
};

export default AboutUs;
