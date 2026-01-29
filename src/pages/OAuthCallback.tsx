import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (window.opener) {
      if (code) {
        window.opener.postMessage({ type: 'oauth_callback', code }, window.location.origin);
      } else if (error) {
        window.opener.postMessage({ type: 'oauth_error', error }, window.location.origin);
      }
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing authorization...</p>
      </div>
    </div>
  );
}
