import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MapPin, MessageSquare } from 'lucide-react';

const ContactUs = () => {
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
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Get in touch</h1>
                    <p className="text-xl text-muted-foreground">We'd love to hear from you. Here's how you can reach us.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contact Options */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <Mail className="text-indigo-400 h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Support</h3>
                                <p className="text-sm text-muted-foreground mb-2">For technical issues and general inquiries.</p>
                                <a href="mailto:support@projectoye.com" className="text-indigo-400 hover:underline">support@projectoye.com</a>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <MessageSquare className="text-emerald-400 h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Sales</h3>
                                <p className="text-sm text-muted-foreground mb-2">Interested in an Enterprise plan?</p>
                                <a href="mailto:sales@projectoye.com" className="text-indigo-400 hover:underline">sales@projectoye.com</a>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <MapPin className="text-amber-400 h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Headquarters</h3>
                                <p className="text-sm text-muted-foreground">
                                    123 Innovation Drive<br />
                                    Tech City, TC 94000<br />
                                    United States
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Placeholder */}
                    <div className="p-8 rounded-3xl bg-slate-900 border border-white/10">
                        <h3 className="text-xl font-bold mb-6">Send us a message</h3>
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-lg bg-black border border-white/10 focus:border-indigo-500 outline-none transition-colors" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Email</label>
                                <input type="email" className="w-full px-4 py-3 rounded-lg bg-black border border-white/10 focus:border-indigo-500 outline-none transition-colors" placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Message</label>
                                <textarea className="w-full px-4 py-3 rounded-lg bg-black border border-white/10 focus:border-indigo-500 outline-none transition-colors min-h-[120px]" placeholder="How can we help?" />
                            </div>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold h-12">Send Message</Button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ContactUs;
