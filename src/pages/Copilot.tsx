import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { copilotSuggestions } from '../data/mockData';
import { useData } from '../context/DataContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Copilot() {
  const { askCopilot } = useData();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Welcome to the **Sentinel Nexus AI Copilot**. I can help you investigate incidents, query entity profiles, explore the knowledge graph, and analyze risk patterns.\n\nTry one of the suggested queries below, or ask anything about the monitored environment.' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEnd.current) {
      const parent = messagesEnd.current.parentElement;
      if (parent) {
        parent.scrollTop = parent.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = text || input.trim();
    if (!query || typing) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInput('');
    setTyping(true);

    try {
      const reply = await askCopilot(query);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to retrieve response from Copilot server.' }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Copilot</h1>
          <div className="subtitle">Natural-language investigation assistant</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--ink-secondary)', fontSize: 'var(--text-xs)' }}>
          <Sparkles size={14} />
          <span>Powered by Graph + Feature Store + LLM</span>
        </div>
      </div>

      <div className="copilot-panel">
        <div className="copilot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`copilot-message ${msg.role}`}>
              <div className="copilot-bubble">
                {msg.content.split('\n').map((line, j) => {
                  if (line.startsWith('```')) return null;
                  const formatted = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`(.*?)`/g, '<code>$1</code>');
                  return <p key={j} style={{ marginBottom: line === '' ? 8 : 4 }} dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }} />;
                })}
              </div>
            </div>
          ))}
          {typing && (
            <div className="copilot-message assistant">
              <div className="copilot-bubble" style={{ display: 'flex', gap: 4 }}>
                <span className="skeleton" style={{ width: 6, height: 6, borderRadius: '50%' }} />
                <span className="skeleton" style={{ width: 6, height: 6, borderRadius: '50%', animationDelay: '200ms' }} />
                <span className="skeleton" style={{ width: 6, height: 6, borderRadius: '50%', animationDelay: '400ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        <div style={{ padding: '0 var(--space-4) var(--space-3)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {messages.length <= 1 && copilotSuggestions.map(s => (
            <button key={s} className="btn btn-secondary" style={{ fontSize: 'var(--text-xs)', padding: '4px 10px' }}
              onClick={() => handleSend(s)}>{s}</button>
          ))}
        </div>

        <div className="copilot-input-area">
          <input
            className="copilot-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about incidents, entities, risk patterns..."
            disabled={typing}
          />
          <button className="copilot-send" onClick={() => handleSend()} disabled={typing}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
