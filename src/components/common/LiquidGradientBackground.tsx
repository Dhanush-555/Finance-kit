import React from 'react';
import { motion } from 'framer-motion';

export const LiquidGradientBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 z-0">
      
      {/* 
        The Liquid Gradient Effect 
        Created by massive, highly blurred, slow-moving orbs.
      */}
      
      {/* Deep Indigo Orb */}
      <motion.div
        className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-indigo-600/30 blur-[120px]"
        animate={{
          x: ['-20%', '20%', '-10%', '-20%'],
          y: ['-20%', '10%', '20%', '-20%'],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ top: '10%', left: '10%' }}
      />

      {/* Emerald Glow Orb */}
      <motion.div
        className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-emerald-500/20 blur-[100px]"
        animate={{
          x: ['20%', '-20%', '10%', '20%'],
          y: ['20%', '-10%', '-20%', '20%'],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ bottom: '10%', right: '10%' }}
      />

      {/* Subtle Slate Blue Core Orb for mixing */}
      <motion.div
        className="absolute w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full bg-slate-500/20 blur-[90px]"
        animate={{
          x: ['0%', '15%', '-15%', '0%'],
          y: ['0%', '-15%', '15%', '0%'],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ top: '30%', left: '30%' }}
      />

      {/* Soft noise overlay to make it look premium and prevent banding */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Heavy Vignette to keep edges clean and focus center */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,6,23,0.9)_100%)]" />
    </div>
  );
};
