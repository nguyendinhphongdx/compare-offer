'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS } from '@/data/criteria';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Trash2, Sparkles, Lightbulb, AlertCircle } from 'lucide-react';
import { Streamdown } from 'streamdown';
import { mermaid } from '@streamdown/mermaid';
import { code } from '@streamdown/code';

const SUGGESTED_PROMPTS = [
  'So sánh tổng quan các offer tôi đang có',
  'Offer nào có mức lương tốt nhất?',
  'Tôi nên hỏi gì khi deal lương?',
  'Phân tích ưu nhược điểm từng offer',
  'Nên chọn offer nào và tại sao?',
  'Tư vấn chiến lược thương lượng lương',
];

const SCHEDULE_LABELS: Record<string, string> = {
  mon_fri: 'T2-T6',
  mon_sat_half: 'T2-Sáng T7',
  mon_sat: 'T2-T7',
  shift: 'Ca kíp',
  other: 'Khác',
};

export default function AIAssistant() {
  const { offers, criteria, chatMessages, addChatMessage, updateLastMessage, clearChat } = useStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const buildContext = useCallback(() => {
    if (offers.length === 0) return '';

    const lines: string[] = [`Người dùng có ${offers.length} offer(s):\n`];

    offers.forEach((offer, i) => {
      const status =
        offer.status === 'current' ? 'Công ty hiện tại' :
        offer.status === 'negotiating' ? 'Đang deal' :
        offer.status === 'accepted' ? 'Đã nhận' :
        offer.status === 'declined' ? 'Từ chối' : 'Đang chờ';

      lines.push(`--- Offer ${i + 1}: ${offer.companyName} (${offer.position}) [${status}] ---`);

      const grouped: Record<string, string[]> = {};
      for (const val of offer.values) {
        if (val.value === '' || val.value === 0 || val.value === false) continue;
        const criterion = criteria.find((c) => c.id === val.criterionId);
        if (!criterion) continue;

        const cat = CATEGORY_LABELS[criterion.category] || criterion.category;
        if (!grouped[cat]) grouped[cat] = [];

        let displayVal: string;
        if (criterion.type === 'salary') {
          displayVal = new Intl.NumberFormat('vi-VN').format(Number(val.value)) + ' VNĐ';
        } else if (criterion.type === 'boolean') {
          displayVal = val.value ? 'Có' : 'Không';
        } else if (criterion.type === 'rating') {
          displayVal = `${val.value}/5`;
        } else if (criterion.type === 'work_schedule') {
          displayVal = SCHEDULE_LABELS[String(val.value)] || String(val.value);
        } else {
          displayVal = String(val.value);
        }

        grouped[cat].push(`  ${criterion.name}: ${displayVal}`);
      }

      for (const [cat, items] of Object.entries(grouped)) {
        lines.push(`[${cat}]`);
        lines.push(...items);
      }
      lines.push('');
    });

    return lines.join('\n');
  }, [offers, criteria]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    addChatMessage({ role: 'user', content: trimmed });
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const isFirstMessage = chatMessages.length === 0;
      const context = isFirstMessage ? buildContext() : undefined;
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context, history }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi không xác định');
      }

      // Create placeholder assistant message
      addChatMessage({ role: 'assistant', content: '' });
      let accumulated = '';

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('Không thể đọc stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              updateLastMessage(accumulated);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối';
      setError(msg);
      addChatMessage({
        role: 'assistant',
        content: `⚠️ ${msg}`,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles size={24} className="text-primary" />
            AI Tư vấn
          </h1>
          <p className="text-muted-foreground mt-1">
            Powered by Gemini — phân tích và tư vấn offers thông minh
          </p>
        </div>
        {chatMessages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 size={14} /> Xóa lịch sử
          </Button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 pr-4">
        <div className="space-y-4 pb-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12">
              <Avatar className="w-16 h-16 mx-auto mb-4 bg-primary/10">
                <AvatarFallback className="bg-primary/10">
                  <Bot size={28} className="text-primary" />
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-medium mb-2">Xin chào! 👋</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                Tôi là AI trợ lý (Gemini), sẵn sàng giúp bạn phân tích, so sánh và đưa ra quyết định về các offer.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setInput(prompt);
                      inputRef.current?.focus();
                    }}
                  >
                    <Lightbulb size={12} /> {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary">
                    <Bot size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
              <Card
                className={`max-w-[75%] px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="text-sm leading-relaxed prose dark:prose-invert prose-sm max-w-none">
                    <Streamdown plugins={{ mermaid, code }} mermaid={{ config: { theme: 'dark' } }}>
                      {msg.content}
                    </Streamdown>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                )}
              </Card>
              {msg.role === 'user' && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-chart-2/15 text-chart-2">
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary">
                  <Bot size={16} />
                </AvatarFallback>
              </Avatar>
              <Card className="px-4 py-3 rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <Card className="p-3 flex gap-3 items-end mt-2">
        <Textarea
          ref={inputRef}
          className="flex-1 border-none shadow-none resize-none min-h-9 focus-visible:ring-0"
          rows={1}
          placeholder="Hỏi về offers, lương, phúc lợi, phỏng vấn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />
        <Button size="icon" disabled={!input.trim() || isTyping} onClick={handleSend}>
          <Send size={16} />
        </Button>
      </Card>
    </div>
  );
}
