import './globals.css';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

const display = Fraunces({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--font-display' });
const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata = {
  title: 'AI Court Orders API',
  description: 'Agent-facing API + MCP for the AI Court Orders dataset.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <header className="topbar">
          <a href="/" className="brand"><span className="seal">§</span> AI Court Orders</a>
          <nav className="nav-links">
            <a href="/chat">Chat</a>
            <a href="/openapi.json">API spec</a>
            <a href="/api/stats">Stats</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
