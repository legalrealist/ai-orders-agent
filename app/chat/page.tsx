import Chat from './Chat';

export const metadata = {
  title: 'Chat · AI Court Orders',
  description: 'Ask an AI assistant about the AI Court Orders dataset.',
};

export default function ChatPage() {
  return (
    <main>
      <h1>Chat with the AI Court Orders dataset</h1>
      <p>
        Ask in plain English — the assistant queries 900+ U.S. court orders and state-bar AI ethics
        opinions to answer. <a href="/">← back to the API</a>
      </p>
      <Chat />
    </main>
  );
}
