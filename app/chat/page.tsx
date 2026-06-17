import Chat from './Chat';

export const metadata = {
  title: 'Chat · AI Court Orders',
  description: 'Ask an AI assistant about the AI Court Orders dataset.',
};

export default function ChatPage() {
  return (
    <main className="wrap">
      <section className="hero" style={{ paddingBottom: 0 }}>
        <p className="eyebrow rise d1">Live demo · funded model</p>
        <h1 className="rise d2" style={{ fontSize: 'clamp(30px, 5vw, 44px)' }}>Ask the record.</h1>
        <p className="lead rise d3">
          Plain-English questions, answered from {`929`}+ U.S. court orders and state-bar AI ethics
          opinions. The assistant queries the dataset live and cites the orders it used.{' '}
          <a className="backlink" href="/">← back to the API</a>
        </p>
      </section>
      <div className="rise d4" style={{ marginTop: 28 }}>
        <Chat />
      </div>
    </main>
  );
}
