import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
}

/**
 * GlassCard Component
 * 
 * A versatile card component with glassmorphic styling.
 */
export default function GlassCard({
  children,
  className = '',
  variant = 'light',
}: GlassCardProps) {
  const baseClasses = variant === 'light' ? 'glass-card' : 'glass-card-dark';
  
  // Check if padding is explicitly set in className (including p-0)
  const hasPaddingOverride = /\bp-0\b|\bpx-|\bpy-|\bpt-|\bpb-|\bpl-|\bpr-/.test(className);
  const defaultPadding = hasPaddingOverride ? '' : 'p-8';
  
  return (
    <div className={`${baseClasses} rounded-3xl ${defaultPadding} ${className}`}>
      {children}
    </div>
  );
}


