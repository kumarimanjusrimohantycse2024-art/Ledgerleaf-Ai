"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Loader2, AlertCircle, FileText } from "lucide-react";

export default function AssistantPage() {
  const [messages, setMessages] = useState<{ role: string; content: string; sources?: any[] }[]>([
    { role: "assistant", content: "Hello! I'm your AI finance assistant. I can help you understand your financial records, find overdue invoices, summarize expenses, and more.\n\nTry asking: \"Which invoices are overdue?\" or \"What were my expenses this month?\"\n\n*Note: AI requires an API key configured in the backend. In demo mode, I'll explain what I would do.*" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    // In demo mode without AI backend, provide helpful local response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `I understand you're asking about: "${msg}"\n\nTo provide real answers grounded in your financial records, the AI backend needs to be configured with an API key (OpenAI or compatible). Once configured, I would:\n\n1. **Query your authorized records** — invoices, expenses, transactions\n2. **Calculate results using deterministic code** — not AI estimation\n3. **Link answers to source records** — so you can verify\n4. **Propose actions for your approval** — never execute without permission\n\nTo enable: Set \`OPENAI_API_KEY\` in the backend \`.env\` file and restart the server.`,
        sources: [],
      }]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-charcoal-900">AI Finance Assistant</h1>
        <p className="text-sm text-charcoal-400 mt-1">Ask questions about your finances. Answers are grounded in your records.</p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-sage-200 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-forest-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-forest-600" />
                </div>
              )}
              <div className={`max-w-xl rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-forest-600 text-white" : "bg-sage-50 border border-sage-200 text-charcoal-700"}`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-sage-200">
                    <p className="text-xs text-charcoal-400 flex items-center gap-1"><FileText className="w-3 h-3" /> Sources:</p>
                    {msg.sources.map((s: any, j: number) => (
                      <p key={j} className="text-xs text-forest-600 mt-0.5">{s.type}: {s.id}</p>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 bg-charcoal-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-charcoal-500" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-forest-100 rounded-lg flex items-center justify-center"><Bot className="w-4 h-4 text-forest-600" /></div>
              <div className="bg-sage-50 border border-sage-200 rounded-xl px-4 py-3"><Loader2 className="w-4 h-4 text-forest-600 animate-spin" /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-sage-200 p-4">
          <div className="flex items-center gap-2 bg-cream-50 rounded-xl border border-sage-300 px-4 py-1">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} placeholder="Ask about your finances…"
              className="flex-1 bg-transparent py-2.5 text-sm text-charcoal-800 placeholder:text-charcoal-300 outline-none" />
            <button onClick={send} disabled={loading || !input.trim()} className="bg-forest-600 hover:bg-forest-700 disabled:bg-forest-300 text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-charcoal-300 mt-2 text-center">AI answers are grounded in your authorized records. Financial calculations use deterministic code.</p>
        </div>
      </div>
    </div>
  );
}
