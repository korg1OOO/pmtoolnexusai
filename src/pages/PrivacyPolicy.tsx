import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Lock, Eye } from 'lucide-react';
import { ContactFormModal } from '@/components/modals/ContactFormModal';

const PrivacyPolicy = () => {
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

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-6">
                        <ShieldCheck size={12} />
                        <span>Last Updated: February 2026</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-slate-900">Privacy Policy</h1>
                    <p className="text-xl text-slate-600 leading-relaxed">
                        Your trust is the foundation of our business. We are committed to protecting your data with enterprise-grade security and transparency.
                    </p>
                </div>

                <div className="space-y-12 text-slate-600">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Eye className="text-indigo-600 h-4 w-4" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Data Collection</h2>
                        </div>
                        <p>
                            We collect information to provide better services to all our users. This includes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li>Basic account information (name, email) for authentication.</li>
                            <li>Project data you explicitly input into the system.</li>
                            <li>Usage data to help us improve system performance and user experience.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-pink-100 flex items-center justify-center">
                                <Lock className="text-pink-600 h-4 w-4" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Data Security</h2>
                        </div>
                        <p>
                            We employ industry-standard security measures to protect your unauthorized access, alteration, disclosure, or destruction of data.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li>All data is encrypted in transit (TLS 1.3) and at rest (AES-256).</li>
                            <li>Strict role-based access controls (RBAC) are enforced securely.</li>
                            <li>Regular security audits and penetration testing.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Your Rights</h2>
                        <p>
                            You have the right to request access to, correction of, or deletion of your personal data. You may also object to processing or request data portability.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us via our secure form:
                        </p>
                        <ContactFormModal defaultSubject="Privacy Policy Inquiry">
                            <Button variant="link" className="p-0 h-auto text-indigo-600 font-semibold hover:text-indigo-700">
                                Contact Privacy Team &rarr;
                            </Button>
                        </ContactFormModal>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
