import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';

export function NotFoundView() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="max-w-2xl w-full p-8 md:p-12 text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
                    <h2 className="text-3xl font-semibold mb-2">Page Not Found</h2>
                    <p className="text-muted-foreground text-lg">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <Button onClick={() => navigate(-1)} variant="outline" size="lg">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Button onClick={() => navigate('/')} size="lg">
                        <Home className="w-4 h-4 mr-2" />
                        Go Home
                    </Button>
                </div>

                <div className="border-t pt-8">
                    <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                        Quick Links
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/?view=dashboard')}
                        >
                            Dashboard
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/?view=projects')}
                        >
                            Projects
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/?view=portfolio-management')}
                        >
                            Portfolios
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/?view=settings')}
                        >
                            Settings
                        </Button>
                    </div>
                </div>

                <div className="mt-8 text-sm text-muted-foreground">
                    <p>
                        Need help? <a href="mailto:support@projectoye.com" className="text-primary hover:underline">Contact Support</a>
                    </p>
                </div>
            </Card>
        </div>
    );
}
