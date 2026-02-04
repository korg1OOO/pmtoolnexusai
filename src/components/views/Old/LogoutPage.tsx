import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function LogoutPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-md w-full bg-card/40 backdrop-blur-xl border border-primary/10 rounded-3xl p-8 shadow-2xl relative"
            >
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <LogOut className="h-10 w-10 text-primary" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Successfully Logged Out</h1>
                        <p className="text-muted-foreground leading-relaxed">
                            Thank you for using ProjectOye. Your session has been securely closed.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 w-full pt-4">
                        <Button
                            size="lg"
                            className="rounded-full font-bold group"
                            onClick={() => navigate('/login')}
                        >
                            Sign In Again
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10"
                            onClick={() => navigate('/landing')}
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Return to Landing
                        </Button>
                    </div>

                    <div className="pt-8 border-t border-primary/5 w-full">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">
                            ProjectOye Enterprise Security Engine
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
