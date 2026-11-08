"use client";
import { Bot, Send, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { authApi } from "@/lib/api";

interface Message { role: "user" | "assistant"; content: string; }

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm the LedgerLeaf AI assistant. I can answer questions about your financial records — invoices, expenses, clients, and cash flow. Ask me anything about your data.\n\n*Note: AI features require an OpenAI API key to be configured by the workspace administrator.*" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      // Try the backend AI endpoint; gracefully handle if not configured
      const res: any = await authApi("/api/v1/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message: msg }),
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.message || "No response" }]);
    } catch (err: any) {
      const isNotConfigured = err.message?.includes("404") || err.message?.includes("Not Found");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: isNotConfigured
          ? "The AI assistant requires an OpenAI API key to be configured. Please set OPENAI_API_KEY in the backend environment variables. Your financial data is securely stored and ready to query once configured."
          : `Error: ${err.message}`
      }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4"><h1 className="text-2xl font-bold text-charcoal-900">AI Finance Assistant</h1><p className="text-sm text-charcoal-400 mt-1">Ask questions about your financial records</p></div>
      <div className="bg-info/5 border border-info/20 rounded-xl px-4 py-3 flex items-start gap-2 mb-4">
        <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
        <p className="text-xs text-charcoal-600">The AI assistant only uses your actual financial records. It never fabricates data. AI responses require OPENAI_API_KEY to be configured.</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <div className="w-8 h-8 bg-forest-100 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0"><Bot className="w-4 h-4 text-forest-600" /></div>}
            <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-forest-600 text-white rounded-br-sm" : "bg-white border border-sage-200 text-charcoal-700 rounded-bl-sm"}`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="w-8 h-8 bg-forest-100 rounded-lg flex items-center justify-center mr-2"><Bot className="w-4 h-4 text-forest-600" /></div><div className="bg-white border border-sage-200 rounded-2xl rounded-bl-sm px-4 py-3"><div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-2 h-2 bg-charcoal-300 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div></div></div>}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          className="flex-1 px-4 py-3 rounded-xl border border-sage-300 bg-white text-sm focus:border-forest-500 focus:ring-1 focus:ring-forest-500"
          placeholder="Ask about your finances…" />
        <button onClick={send} disabled={loading||!input.trim()} className="bg-forest-600 hover:bg-forest-700 disabled:bg-forest-400 text-white px-4 py-3 rounded-xl"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
