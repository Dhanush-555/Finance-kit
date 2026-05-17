import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface NumberCounterProps {
  value: number;
  prefix?: string;
  decimals?: number;
  className?: string;
  isCurrency?: boolean;
}

export const NumberCounter: React.FC<NumberCounterProps> = ({ 
  value, 
  prefix = '', 
  decimals = 0, 
  className = '',
  isCurrency = false
}) => {
  const springValue = useSpring(0, {
    bounce: 0,
    duration: 1500, // 1.5 seconds to count up
  });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  const displayValue = useTransform(springValue, (current) => {
    if (isCurrency) {
      return prefix + current.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    return prefix + current.toFixed(decimals);
  });

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
};
