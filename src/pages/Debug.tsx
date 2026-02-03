import { Button } from '@/components/ui/button';

export default function DebugPage() {
    return (
        <div style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
            <h1>Debug Page</h1>
            <p>If you can see this, React is working!</p>
            <Button>Test Button</Button>
        </div>
    );
}
