import React from 'react';

interface PageShellProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}

export default function PageShell({ header, children, wide = true }: PageShellProps) {
  return (
    <div className="page-surface">
      {header && (
        <div className="page-header-bar">
          {header}
        </div>
      )}
      <div className="page-scroll">
        <div className={wide ? 'page-container page-container-wide' : 'page-container'}>
          {children}
        </div>
      </div>
    </div>
  );
}
