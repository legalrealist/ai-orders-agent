'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

const TOOL_LABELS: Record<string, string> = {
  'tool-search_orders': 'searching orders',
  'tool-list_orders': 'filtering orders',
  'tool-get_order': 'fetching a record',
  'tool-get_pdf': 'looking up a PDF',
  'tool-facets': 'counting facets',
  'tool-stats': 'reading dataset stats',
  'tool-bar_opinions': 'reading bar opinions',
};

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const busy = status === 'submitted' || status === 'streaming';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput('');
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {messages.length === 0 && (
          <p style={{ color: '#666' }}>
            Ask about AI court orders — e.g. “Which judges sanctioned attorneys for hallucinated citations?” or
            “How many standing orders require AI disclosure?”
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <strong style={{ fontSize: 13, color: m.role === 'user' ? '#0b6' : '#06c' }}>
              {m.role === 'user' ? 'You' : 'Assistant'}
            </strong>
            {m.parts.map((p, i) => {
              if (p.type === 'text') return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{p.text}</span>;
              if (p.type.startsWith('tool-')) {
                return (
                  <span key={i} style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>
                    {TOOL_LABELS[p.type] ?? p.type.replace('tool-', '')}…
                  </span>
                );
              }
              return null;
            })}
          </div>
        ))}
        {error && (
          <span style={{ color: '#c00', fontSize: 14 }}>
            {/429|503|rate|capacity/i.test(error.message)
              ? 'Rate limit reached — please wait a bit and try again.'
              : 'Something went wrong. Please try again.'}
          </span>
        )}
      </div>

      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the AI court orders dataset…"
          style={{ flex: 1, padding: '10px 12px', fontSize: 15, border: '1px solid #ccc', borderRadius: 6 }}
        />
        {busy ? (
          <button type="button" onClick={stop} style={btn}>Stop</button>
        ) : (
          <button type="submit" disabled={!input.trim()} style={btn}>Send</button>
        )}
      </form>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '10px 18px', fontSize: 15, border: '1px solid #06c', background: '#06c',
  color: '#fff', borderRadius: 6, cursor: 'pointer',
};
