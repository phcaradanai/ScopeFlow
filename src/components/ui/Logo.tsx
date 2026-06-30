import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export default function Logo({ className = '', ...props }: LogoProps) {
  const isCurrentColor = props.stroke === 'currentColor';
  const mainStroke = isCurrentColor ? 'currentColor' : 'url(#sf-logo-grad)';
  const subtleStroke = isCurrentColor ? 'currentColor' : 'url(#sf-logo-grad-subtle)';
  const subtleOpacity = isCurrentColor ? 0.3 : 1;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="sf-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" /> {/* Indigo */}
          <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet/Purple */}
        </linearGradient>
        <linearGradient id="sf-logo-grad-subtle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
          <stop offset="100%" stopColor="rgba(139, 92, 246, 0.4)" />
        </linearGradient>
      </defs>

      {/* 1. Symmetrical Scope Circle: Two flanking arcs with equal gaps at bottom-left & top-right */}
      <path
        d="M 69.8 30.2 A 28 28 0 0 0 30.2 69.8"
        stroke={subtleStroke}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeOpacity={subtleOpacity}
      />
      <path
        d="M 30.2 69.8 A 28 28 0 0 0 69.8 30.2"
        stroke={subtleStroke}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeOpacity={subtleOpacity}
      />

      {/* 2. Symmetrical Flow Wave (S-Curve): Weaving through the two gaps */}
      <path
        d="M 20 80 C 35 80 35 20 50 50 C 65 80 65 20 80 20"
        stroke={mainStroke}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Start Node (Customer request input) */}
      <circle
        cx="20"
        cy="80"
        r="4.5"
        fill={mainStroke}
      />

      {/* 4. Target Node & Scope Reticle (Finalized brief/quotation/scope) */}
      <circle
        cx="80"
        cy="20"
        r="7.5"
        fill={mainStroke}
      />
      <circle
        cx="80"
        cy="20"
        r="14.5"
        stroke={mainStroke}
        strokeWidth="2"
        strokeDasharray="4 3"
      />
    </svg>
  );
}
