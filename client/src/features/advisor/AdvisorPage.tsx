import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Send, MessageSquare, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { API_URL, TIER_LIMITS } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store';
import type { AdvisorChat, AdvisorMessage } from '../../types';

export function AdvisorPage() {
  const user = useAuthStore((s) => s.user);
  const [chats, setChats] = useState<AdvisorChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tierLimit = user ? TIER_LIMITS[user.tier].aiQueries : 0;
  const queriesUsed = user?.aiQueriesUsed ?? 0;
  const queriesRemaining = tierLimit === Infinity ? Infinity : Math.max(tierLimit - queriesUsed, 0);

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get<AdvisorChat[]>('/advisor/chats');
      setChats(res.data);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  }, []);

  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const res = await api.get<AdvisorMessage[]>(`/advisor/chats/${chatId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, []);

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await api.get<string[]>('/advisor/prompts');
      setPrompts(res.data);
    } catch (err) {
      console.error('Failed to fetch prompts:', err);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    fetchPrompts();
  }, [fetchChats, fetchPrompts]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  async function createNewChat() {
    try {
      const res = await api.post<AdvisorChat>('/advisor/chats');
      setChats((prev) => [res.data, ...prev]);
      setActiveChatId(res.data.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  }

  async function sendMessage(text?: string) {
    const content = text || input.trim();
    if (!content || sending) return;

    let chatId = activeChatId;

    // Create a new chat if none active
    if (!chatId) {
      try {
        const res = await api.post<AdvisorChat>('/advisor/chats');
        setChats((prev) => [res.data, ...prev]);
        chatId = res.data.id;
        setActiveChatId(chatId);
      } catch {
        return;
      }
    }

    setInput('');
    setSending(true);

    // Add user message optimistically
    const userMsg: AdvisorMessage = {
      id: 'temp-user-' + Date.now(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Send message and stream the response
      const token = localStorage.getItem('smartwallet_token');
      const response = await fetch(`${API_URL}/advisor/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback: just refetch messages
        await fetchMessages(chatId);
        setSending(false);
        return;
      }

      setStreaming(true);
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMsg: AdvisorMessage = {
        id: 'temp-assistant-' + Date.now(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE lines
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: assistantContent };
                  }
                  return updated;
                });
              }
            } catch {
              // Plain text chunk
              assistantContent += data;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: assistantContent };
                }
                return updated;
              });
            }
          }
        }
      }

      setStreaming(false);
      // Refresh chats in case title was updated
      fetchChats();
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic messages and refetch
      if (chatId) await fetchMessages(chatId);
    } finally {
      setSending(false);
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
        } flex-shrink-0 transition-all duration-200`}
      >
        <div className="card h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Chats</h2>
            <Button size="sm" onClick={createNewChat}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {chats.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
                No chats yet
              </p>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                    chat.id === activeChatId
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 inline mr-2" />
                  {chat.title || 'New Chat'}
                </button>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
            {queriesRemaining === Infinity ? (
              <span>Unlimited AI queries</span>
            ) : (
              <span>{queriesRemaining} queries remaining</span>
            )}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 card flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-[var(--color-bg-secondary)] transition-colors lg:hidden"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <Sparkles className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold">AI Financial Advisor</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !activeChatId && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-12 h-12 text-primary-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ask your AI Financial Advisor</h3>
              <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">
                Get personalized financial advice, spending analysis, and savings tips based on your data.
              </p>
              {prompts.length > 0 && (
                <div className="flex flex-wrap gap-2 max-w-lg justify-center">
                  {prompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt)}
                      className="px-3 py-2 text-sm rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition-colors border border-[var(--color-border)]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.length === 0 && activeChatId && prompts.length > 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-[var(--color-text-secondary)] mb-4">
                Start a conversation or try a suggested prompt:
              </p>
              <div className="flex flex-wrap gap-2 max-w-lg justify-center">
                {prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-2 text-sm rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition-colors border border-[var(--color-border)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text)]'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-primary-200' : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {streaming && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 px-4 py-3 bg-[var(--color-bg-secondary)] rounded-xl">
                <span className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-[var(--color-border)]">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                queriesRemaining === 0
                  ? 'Query limit reached. Upgrade to continue.'
                  : 'Ask about your finances...'
              }
              disabled={queriesRemaining === 0}
              rows={1}
              className="input flex-1 resize-none max-h-32"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending || queriesRemaining === 0}
              isLoading={sending && !streaming}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
