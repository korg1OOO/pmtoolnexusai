import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, ShieldCheck, LayoutGrid } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';

const Auth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleOAuthLogin = async (provider: 'google') => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/oauth/callback`,
                },
            });
            if (error) throw error;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Authentication failed";
            toast.error(message);
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>, type: 'login' | 'signup') => {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            if (type === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`
                    }
                });
                if (error) throw error;
                toast.success("Check your email to confirm your account!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/dashboard');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Authentication failed";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col bg-background text-foreground relative">
            <LandingHeader isAuthenticated={false} onLogoClick={() => navigate('/')} />

            <div className="flex-1 flex pt-16 pb-12 w-full h-full">
                {/* Left Side - Product Info */}
                <div className="hidden lg:flex w-1/2 relative bg-zinc-900 flex-col justify-between p-12 overflow-hidden border-r border-white/5">
                    {/* Abstract Backgrounds */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(79,70,229,0.15),transparent_50%)]" />
                    <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.15),transparent_50%)]" />

                    <div className="relative z-10 flex flex-col justify-center h-full">
                        {/* Branding removed as per request */}

                        <div className="space-y-8 max-w-lg">
                            <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
                                Manage complex programs with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">clarity.</span>
                            </h1>
                            <p className="text-lg text-zinc-400 leading-relaxed">
                                The intelligence layer for enterprise orchestration. Visualize dependancies, automate updates, and deliver on time.
                            </p>

                            <div className="space-y-4 pt-4">
                                {[
                                    { icon: Zap, label: "AI-Driven Morning Briefings" },
                                    { icon: ShieldCheck, label: "Enterprise-Grade Security" },
                                    { icon: LayoutGrid, label: "Advanced Timeline Planning" }
                                ].map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-zinc-300">
                                        <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                            <feature.icon size={16} className="text-indigo-400" />
                                        </div>
                                        <span className="font-medium">{feature.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Auth Form */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative bg-background">
                    <div className="w-full max-w-[400px] space-y-6">
                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-full">
                                <TabsTrigger value="login" className="rounded-full">Sign In</TabsTrigger>
                                <TabsTrigger value="signup" className="rounded-full">Sign Up</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login">
                                <div className="space-y-6">
                                    <div className="space-y-2 text-center">
                                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                                        <p className="text-muted-foreground">Enter your credentials to access your workspace</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <Button variant="outline" className="w-full h-11 border-input hover:bg-accent hover:text-accent-foreground" onClick={() => handleOAuthLogin('google')} disabled={isLoading}>
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>}
                                            Continue with Google
                                        </Button>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-muted" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                                        </div>
                                    </div>

                                    <form onSubmit={(e) => handleEmailAuth(e, 'login')} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password">Password</Label>
                                                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</a>
                                            </div>
                                            <Input id="password" name="password" type="password" required className="h-11" />
                                        </div>
                                        <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 font-bold text-white" type="submit" disabled={isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Sign In
                                        </Button>
                                    </form>
                                </div>
                            </TabsContent>

                            <TabsContent value="signup">
                                <div className="space-y-6">
                                    <div className="space-y-2 text-center">
                                        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                                        <p className="text-muted-foreground">Enter your email below to create your account</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <Button variant="outline" className="w-full h-11 border-input hover:bg-accent hover:text-accent-foreground" onClick={() => handleOAuthLogin('google')} disabled={isLoading}>
                                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                                            Continue with Google
                                        </Button>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-muted" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                                        </div>
                                    </div>

                                    <form onSubmit={(e) => handleEmailAuth(e, 'signup')} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email">Email</Label>
                                            <Input id="signup-email" name="email" type="email" placeholder="m@example.com" required className="h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <Input id="signup-password" name="password" type="password" required className="h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                                                <li>At least 8 characters</li>
                                                <li>Contains a number</li>
                                                <li>Contains a special character</li>
                                            </ul>
                                        </div>
                                        <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 font-bold text-white" type="submit" disabled={isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Create Account
                                        </Button>
                                    </form>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            <LandingFooter />
        </div>
    );
};

export default Auth;
