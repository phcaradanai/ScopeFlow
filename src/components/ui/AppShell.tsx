import React from 'react';

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-sidebar-region">
        {sidebar}
      </div>
      <main className="app-main-region">
        {children}
      </main>
    </div>
  );
}
