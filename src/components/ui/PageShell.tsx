import React from 'react';

interface PageShellProps {
  header?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageShell({ header, children }: PageShellProps) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#121214] to-[#09090b] overflow-y-auto">
      {header && (
        <div className="flex-none px-8 py-6 border-b border-white/10 bg-white/[0.01] backdrop-blur-md z-10 shadow-sm">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1080px] mx-auto w-full px-8 py-10 flex flex-col gap-8">
          {children}
        </div>
      </div>
    </div>
  );
}
