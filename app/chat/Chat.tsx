'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

const TOOL_LABELS: Record<string, string> = {
  'tool-search_orders': 'searching orders',
  'tool-list_orders': 'filtering orders',
  'tool-get_order': 'fetching a record',
  'tool-get_pdf': 'looking up a PDF',
  'tool-get_text': 'reading the full order text',
  'tool-facets': 'counting facets',
  'tool-stats': 'reading dataset stats',
  'tool-bar_opinions': 'reading bar opinions',
};

const STARTERS = [
  'Which judges sanctioned attorneys for hallucinated citations?',
  'How many standing orders require AI disclosure?',
  'Summarize the most recent sanctions opinion.',
  'What does the California bar say about AI use?',
];

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
    <div className="chat-shell">
      <div className="chat-log">
        {messages.length === 0 && (
          <div>
            <p className="starter-head">Try one of these to start:</p>
            <div className="pills">
              {STARTERS.map((s) => (
                <button key={s} type="button" className="pill" disabled={busy} onClick={() => !busy && sendMessage({ text: s })}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role === 'user' ? 'user' : 'assistant'}`}>
            <span className="who">{m.role === 'user' ? 'You' : 'Assistant'}</span>
            {m.parts.map((p, i) => {
              if (p.type === 'text') return p.text ? <span key={i} className="bubble">{p.text}</span> : null;
              if (p.type === 'reasoning') return <span key={i} className="thinking">Thinking…</span>;
              if (p.type.startsWith('tool-')) {
                return <span key={i} className="tool-step">{TOOL_LABELS[p.type] ?? p.type.replace('tool-', '')}…</span>;
              }
              return null;
            })}
          </div>
        ))}

        {status === 'submitted' && (
          <div className="msg assistant">
            <span className="who">Assistant</span>
            <span className="thinking">Thinking…</span>
          </div>
        )}

        {error && (
          <span className="err">
            {/429|503|rate|capacity/i.test(error.message)
              ? 'Rate limit reached — please wait a bit and try again.'
              : 'Something went wrong. Please try again.'}
          </span>
        )}
      </div>

      <form onSubmit={submit} className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the AI court orders dataset…"
        />
        {busy ? (
          <button type="button" className="send" onClick={stop}>Stop</button>
        ) : (
          <button type="submit" className="send" disabled={!input.trim()}>Send</button>
        )}
      </form>
    </div>
  );
}
