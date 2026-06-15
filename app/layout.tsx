export const metadata = {
  title: 'AI Court Orders API',
  description: 'Agent-facing API + MCP for the AI Court Orders dataset.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760, margin: '40px auto', padding: '0 16px', lineHeight: 1.5 }}>
        {children}
      </body>
    </html>
  );
}
