import Chat from './Chat';

export const metadata = {
  title: 'Chat · AI Court Orders',
  description: 'Ask an AI assistant about the AI Court Orders dataset.',
};

export default function ChatPage() {
  return (
    <main className="wrap">
      <section className="hero" style={{ paddingBottom: 0 }}>
        <p className="eyebrow rise d1">Courtesy demo · funded, rate-limited model</p>
        <h1 className="rise d2" style={{ fontSize: 'clamp(30px, 5vw, 44px)' }}>Ask the record.</h1>
        <p className="lead rise d3">
          A convenience demo of the same tools an LLM would call — plain-English questions answered
          from {`929`}+ U.S. court orders and state-bar AI ethics opinions, with the orders cited.
          For the full human experience, use the <a href="https://legalhack.io/explorer/charts/dist/index.html#cat=0" target="_blank" rel="noreferrer">visual Explorer ↗</a>;
          to build on it, <a href="/">connect your own LLM</a>.
        </p>
      </section>
      <div className="rise d4" style={{ marginTop: 28 }}>
        <Chat />
      </div>
    </main>
  );
}
