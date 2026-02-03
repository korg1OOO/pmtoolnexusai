import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('[main.tsx] Script is loading...');
console.log('[main.tsx] Root element:', document.getElementById('root'));

createRoot(document.getElementById("root")!).render(<App />);

console.log('[main.tsx] React app should be mounted');
