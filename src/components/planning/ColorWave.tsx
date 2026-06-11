// src/components/planning/ColorWave.tsx
import { motion } from 'framer-motion';

interface ColorWaveProps {
  color: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const ColorWave = ({ color, intensity = 'medium' }: ColorWaveProps) => {
  const duration = intensity === 'high' ? 2.2 : intensity === 'medium' ? 3.8 : 5.5;
  const opacity = intensity === 'high' ? 0.18 : intensity === 'medium' ? 0.12 : 0.08;

  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      {/* Base layer */}
      <div 
        className="absolute inset-0" 
        style={{ background: `linear-gradient(90deg, ${color}15, transparent)` }} 
      />
      
      {/* Flowing wave layers */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}, transparent)`,
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      />
      
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}22, transparent)`,
          backgroundSize: '300% 100%',
        }}
        animate={{ backgroundPosition: ['200% 50%', '0% 50%'] }}
        transition={{ duration: duration * 1.6, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};