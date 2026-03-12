import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rocket, Users, Globe, Shield } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[100] flex items-center justify-between px-8">
                <div className="flex items-center gap-2">
                    <a href="/" className="hover:opacity-80 transition-opacity">
                        <span className="text-lg font-bold tracking-tight text-slate-900">ProjectOye</span>
                    </a>
                </div>
                <a href="/">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                        <ArrowLeft size={16} /> Back to Home
                    </Button>
                </a>
            </header>

            <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto space-y-20">

                {/* Hero Section */}
                <section className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-full mb-4">
                        <Rocket className="text-indigo-600 h-8 w-8" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900">
                        We orchestrate the future.
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        ProjectOye was born from a simple belief: Complex programs shouldn't be chaotic. We build intelligence layers for the world's most ambitious teams.
                    </p>
                </section>

                {/* Values Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors group">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Globe className="text-blue-600 h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Global Scale</h3>
                        <p className="text-slate-600">Designed for enterprises that span continents. Seamless collaboration across time zones and cultures.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-colors group">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Users className="text-purple-600 h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Human Centric</h3>
                        <p className="text-slate-600">Technology should empower people, not replace them. We amplify human intelligence with AI.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors group">
                        <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Shield className="text-emerald-600 h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Uncompromising Trust</h3>
                        <p className="text-slate-600">Your data is your most valuable asset. Security and privacy are baked into our DNA from day one.</p>
                    </div>
                </section>

                {/* Story Section */}
                <section className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100">
                    <h2 className="text-3xl font-bold mb-6 text-slate-900">Our Story</h2>
                    <div className="space-y-6 text-lg text-slate-600 leading-relaxed font-light">
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
            <footer className="py-12 border-t border-slate-200 text-center text-slate-500 bg-slate-50">
                <p>© 2026 ProjectOye Inc. Building the future of work.</p>
            </footer>
        </div>
    );
};

export default AboutUs;
