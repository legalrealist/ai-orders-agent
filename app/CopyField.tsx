'use client';
import { useState } from 'react';

export default function CopyField({ value, display }: { value: string; display?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button type="button" className="copyfield" onClick={copy} title="Copy to clipboard">
      <code>{display ?? value}</code>
      <span className={`cstate${copied ? ' ok' : ''}`}>{copied ? '✓ copied' : 'copy'}</span>
    </button>
  );
}
