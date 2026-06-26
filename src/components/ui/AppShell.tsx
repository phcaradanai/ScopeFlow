import React from 'react';

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="h-screen flex bg-gradient-to-b from-[#121214] to-[#09090b] text-text">
      {sidebar}
      <main className="flex-1 h-full overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
