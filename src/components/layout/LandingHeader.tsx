import { motion } from 'framer-motion';
import { LayoutGrid, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export const LandingHeader = ({ onLogoClick, isAuthenticated }: { onLogoClick?: () => void, isAuthenticated: boolean }) => {
    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 z-[100] flex items-center justify-between px-8"
        >
            <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onLogoClick}
            >
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                    <LayoutGrid className="text-primary-foreground h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-foreground">ProjectOye</span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground hidden md:flex">
                <a href="/" className="hover:text-foreground transition-colors">Home</a>
                <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
                <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a>
                <a href="/faqs" className="hover:text-foreground transition-colors">FAQs</a>
                <a href="/blog" className="hover:text-foreground transition-colors">Blog</a>
                <a href="/docs" className="hover:text-foreground transition-colors">Docs</a>
                <a href="/about" className="hover:text-foreground transition-colors">About</a>
            </nav>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                {isAuthenticated ? (
                    <a href="/dashboard">
                        <Button size="sm" className="gap-2 shadow-md shadow-primary/20">
                            Dashboard <ArrowRight size={14} />
                        </Button>
                    </a>
                ) : (
                    <>
                        <a href="/login">
                            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
                        </a>
                        <a href="/login">
                            <Button size="sm" className="gap-2 shadow-md shadow-primary/20">
                                Get Started <ArrowRight size={14} />
                            </Button>
                        </a>
                    </>
                )}
            </div>
        </motion.header>
    );
};
