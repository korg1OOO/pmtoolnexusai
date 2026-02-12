/**
 * Subscription Success Page
 * Shown after successful Stripe checkout
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

export function SubscriptionSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Confetti animation could go here
        console.log('Subscription successful!', sessionId);
    }, [sessionId]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4">
            <Card className="max-w-2xl w-full border-2 border-primary/20 shadow-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20">
                            <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <CardTitle className="text-4xl mb-2">
                        Welcome to Premium! 🎉
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Your subscription is now active
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-muted rounded-lg p-6 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            What's Next?
                        </h3>
                        <ul className="space-y-3 ml-7">
                            <li className="flex items-start gap-2">
                                <ArrowRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <span>Your premium features are now unlocked</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ArrowRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <span>Check your email for the invoice and receipt</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ArrowRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <span>Manage your subscription anytime from your dashboard</span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            className="flex-1"
                            size="lg"
                            onClick={() => navigate('/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            size="lg"
                            onClick={() => navigate('/pricing')}
                        >
                            View All Features
                        </Button>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        Need help? <a href="/support" className="text-primary hover:underline">Contact our support team</a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
