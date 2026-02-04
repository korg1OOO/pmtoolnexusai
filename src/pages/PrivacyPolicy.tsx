import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Lock, Eye } from 'lucide-react';

const PrivacyPolicy = () => {
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

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        <ShieldCheck size={12} />
                        <span>Last Updated: February 2026</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Privacy Policy</h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Your trust is the foundation of our business. We are committed to protecting your data with enterprise-grade security and transparency.
                    </p>
                </div>

                <div className="space-y-12 text-slate-300">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <Eye className="text-indigo-400 h-4 w-4" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Data Collection</h2>
                        </div>
                        <p>
                            We collect information to provide better services to all our users. This includes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Basic account information (name, email) for authentication.</li>
                            <li>Project data you explicitly input into the system.</li>
                            <li>Usage data to help us improve system performance and user experience.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                <Lock className="text-pink-400 h-4 w-4" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Data Security</h2>
                        </div>
                        <p>
                            We employ industry-standard security measures to protect your unauthorized access, alteration, disclosure, or destruction of data.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>All data is encrypted in transit (TLS 1.3) and at rest (AES-256).</li>
                            <li>Strict role-based access controls (RBAC) are enforced securely.</li>
                            <li>Regular security audits and penetration testing.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-foreground">Your Rights</h2>
                        <p>
                            You have the right to request access to, correction of, or deletion of your personal data. You may also object to processing or request data portability.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@projectoye.com" className="text-indigo-400 hover:underline">privacy@projectoye.com</a>.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
