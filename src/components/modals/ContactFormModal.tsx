import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface ContactFormModalProps {
    children?: React.ReactNode;
    defaultSubject?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ContactFormModal({ children, defaultSubject = "General Inquiry", open, onOpenChange }: ContactFormModalProps) {
    const [localOpen, setLocalOpen] = React.useState(false);
    const isControlled = open !== undefined;
    const finalOpen = isControlled ? open : localOpen;
    const finalSetOpen = isControlled ? onOpenChange : setLocalOpen;

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
        if (finalSetOpen) finalSetOpen(false);
    };

    return (
        <Dialog open={finalOpen} onOpenChange={finalSetOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] bg-white text-slate-900 border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900">Get in touch</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Fill out the form below and our team will get back to you.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Name</label>
                        <Input required placeholder="John Doe" className="bg-slate-50 border-slate-200 focus-visible:ring-indigo-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <Input required type="email" placeholder="john@example.com" className="bg-slate-50 border-slate-200 focus-visible:ring-indigo-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Subject</label>
                        <Input defaultValue={defaultSubject} className="bg-slate-50 border-slate-200 focus-visible:ring-indigo-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Message</label>
                        <Textarea required placeholder="How can we help you?" className="min-h-[120px] bg-slate-50 border-slate-200 focus-visible:ring-indigo-500" />
                    </div>
                    <div className="pt-2 flex justify-end">
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" disabled={isLoading}>
                            {isLoading ? "Sending..." : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
