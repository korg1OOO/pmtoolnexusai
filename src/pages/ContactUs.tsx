import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MapPin, MessageSquare } from 'lucide-react';
import { ContactFormModal } from '@/components/modals/ContactFormModal';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ContactUs = () => {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success("Message sent successfully!", {
            description: "We've received your message at admin@projectoye.com and will get back to you shortly."
        });

        setIsLoading(false);
        (e.target as HTMLFormElement).reset();
    };

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
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-slate-900">Get in touch</h1>
                    <p className="text-xl text-slate-600">We'd love to hear from you. Here's how you can reach us.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contact Options */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 hover:border-indigo-200 transition-colors">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <Mail className="text-indigo-600 h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1 text-slate-900">Support</h3>
                                <p className="text-sm text-slate-600 mb-3">For technical issues and general inquiries.</p>
                                <ContactFormModal defaultSubject="Technical Support">
                                    <Button variant="link" className="p-0 h-auto text-indigo-600 font-semibold hover:text-indigo-700">
                                        Contact Support &rarr;
                                    </Button>
                                </ContactFormModal>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 hover:border-emerald-200 transition-colors">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <MessageSquare className="text-emerald-600 h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1 text-slate-900">Sales</h3>
                                <p className="text-sm text-slate-600 mb-3">Interested in an Enterprise plan?</p>
                                <ContactFormModal defaultSubject="Sales Inquiry">
                                    <Button variant="link" className="p-0 h-auto text-emerald-600 font-semibold hover:text-emerald-700">
                                        Contact Sales &rarr;
                                    </Button>
                                </ContactFormModal>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 hover:border-amber-200 transition-colors">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <MapPin className="text-amber-600 h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1 text-slate-900">Headquarters</h3>
                                <p className="text-sm text-slate-600">
                                    123 Innovation Drive<br />
                                    Tech City, TC 94000<br />
                                    United States
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Placeholder */}
                    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold mb-6 text-slate-900">Send us a message</h3>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Name</label>
                                <Input required placeholder="John Doe" className="bg-white border-slate-200 focus:border-indigo-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <Input required type="email" placeholder="john@example.com" className="bg-white border-slate-200 focus:border-indigo-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Message</label>
                                <Textarea required placeholder="How can we help?" className="bg-white border-slate-200 focus:border-indigo-500 min-h-[120px]" />
                            </div>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-12 text-white" disabled={isLoading}>
                                {isLoading ? "Sending..." : "Send Message"}
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ContactUs;
