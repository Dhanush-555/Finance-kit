import React from 'react';
import { motion } from 'framer-motion';

export const DataGridBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 flex items-center justify-center z-0">
      
      {/* 
        The perspective container. 
        It gives depth to the child elements.
      */}
      <div 
        className="absolute inset-0"
        style={{ 
          perspective: '1000px', 
          perspectiveOrigin: '50% 50%' 
        }}
      >
        {/* 
          The 3D Plane. 
          Rotated on the X axis to lay flat like a floor.
          Scaled up so the edges don't show when rotated.
        */}
        <motion.div
          className="absolute w-[200%] h-[200%] left-[-50%] top-[-10%]"
          style={{
            transform: 'rotateX(75deg) translateZ(-200px)',
            transformStyle: 'preserve-3d',
            // The actual grid pattern using linear gradients
            backgroundImage: `
              linear-gradient(to right, rgba(16, 185, 129, 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(67, 56, 202, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
          animate={{
            // Animating background position to simulate forward movement
            backgroundPosition: ['0px 0px', '0px 50px']
          }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 1
          }}
        />
        
        {/* 
          A radial gradient overlay to fade out the grid at the edges and in the distance.
          This creates the "infinite depth" illusion.
        */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 20%, #020617 70%)',
          }}
        />
        
        {/* Horizon Glow */}
        <div className="absolute top-[40%] left-0 w-full h-[20%] bg-emerald-500/10 blur-[80px]" />
        <div className="absolute top-[40%] left-0 w-full h-[20%] bg-indigo-500/10 blur-[100px]" />

      </div>
    </div>
  );
};
