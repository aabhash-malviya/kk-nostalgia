export function IconPrev({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 6a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Zm2.7 6 8.5-5.9c.7-.5 1.6 0 1.6.8v10.2c0 .8-.9 1.3-1.6.8L9.7 12Z" />
    </svg>
  );
}

export function IconNext({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17 6a1 1 0 0 0-1 1v10a1 1 0 1 0 2 0V7a1 1 0 0 0-1-1Zm-2.7 6-8.5-5.9c-.7-.5-1.6 0-1.6.8v10.2c0 .8.9 1.3 1.6.8l8.5-5.9Z" />
    </svg>
  );
}

export function IconPlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5.5c0-.9 1-1.4 1.7-.9l10 6.5a1.1 1.1 0 0 1 0 1.8l-10 6.5c-.7.5-1.7 0-1.7-.9V5.5Z" />
    </svg>
  );
}

export function IconPause({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="6.5" y="5" width="4" height="14" rx="1" />
      <rect x="13.5" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
