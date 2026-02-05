import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// DEBUG: Global Error Handler to catch Blank Screen issues
window.onerror = function (message, source, lineno, colno, error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.background = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.zIndex = '999999';
    errorDiv.innerHTML = `
    <h1>Application Error</h1>
    <pre>${message}</pre>
    <pre>${source}:${lineno}:${colno}</pre>
    <pre>${error?.stack || ''}</pre>
  `;
    document.body.appendChild(errorDiv);
};

console.log('[main.tsx] Script is loading...');
try {
    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("Root element not found");

    console.log('[main.tsx] Root element found, mounting...');
    createRoot(rootElement).render(<App />);
    console.log('[main.tsx] React app mount called');
} catch (e: unknown) {
    console.error('[main.tsx] Fatal Render Error:', e);
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : '';
    document.body.innerHTML = `<div style="color:red; padding:20px;"><h1>Fatal Error</h1><pre>${message}\n${stack}</pre></div>`;
}
