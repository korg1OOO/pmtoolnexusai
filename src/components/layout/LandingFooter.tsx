import { motion } from 'framer-motion';

export const LandingFooter = () => (
    <motion.footer
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 h-12 bg-background/80 backdrop-blur-md border-t border-border/50 z-[100] flex items-center justify-between px-8 text-xs text-muted-foreground"
    >
        <div className="flex items-center gap-4">
            <span>© 2026 ProjectOye Inc.</span>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/contact" className="hover:underline">Contact</a>
            <a href="/about" className="hover:underline">About</a>
        </div>
        <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Systems Operational</span>
        </div>
    </motion.footer>
);
