'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Send, Bot, User, Trash2, Sparkles, Lightbulb } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'So sánh tổng quan các offer tôi đang có',
  'Offer nào có mức lương tốt nhất?',
  'Tôi nên hỏi gì khi deal lương?',
  'Phân tích ưu nhược điểm từng offer',
  'Nên chọn offer nào và tại sao?',
  'Tư vấn chiến lược thương lượng lương',
];

export default function AIAssistant() {
  const { offers, criteria, chatMessages, addChatMessage, clearChat } = useStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const generateAIResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    // Build context about offers
    const offerSummaries = offers.map((o) => {
      const base = o.values.find((v) => v.criterionId === 'base_salary');
      const net = o.values.find((v) => v.criterionId === 'net_salary');
      const leave = o.values.find((v) => v.criterionId === 'annual_leave');
      const remote = o.values.find((v) => v.criterionId === 'remote_work');
      const bonus13 = o.values.find((v) => v.criterionId === 'bonus_13th');
      const ratingCriteria = criteria.filter((c) => c.type === 'rating');
      const avgRating = ratingCriteria.reduce((sum, c) => {
        const v = o.values.find((v) => v.criterionId === c.id);
        return sum + Number(v?.value || 0);
      }, 0) / (ratingCriteria.length || 1);

      return {
        name: o.companyName,
        position: o.position,
        status: o.status,
        baseSalary: Number(base?.value || 0),
        netSalary: Number(net?.value || 0),
        leave: Number(leave?.value || 0),
        remote: remote?.value || 'N/A',
        bonus13: bonus13?.value,
        avgRating: avgRating.toFixed(1),
        values: o.values,
      };
    });

    const formatSalary = (val: number) => {
      if (!val) return 'chưa cập nhật';
      return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ';
    };

    // No offers
    if (offers.length === 0) {
      return `Hiện tại bạn chưa có offer nào trong hệ thống. Hãy thêm các offer ở mục "Quản lý Offers" để tôi có thể tư vấn cho bạn nhé!\n\nMột số gợi ý:\n• Thêm ít nhất 2 offer để so sánh\n• Điền đầy đủ thông tin lương, phúc lợi\n• Đánh giá rating cho các tiêu chí định tính`;
    }

    // Compare / overview
    if (msg.includes('so sánh') || msg.includes('tổng quan') || msg.includes('overview')) {
      let response = `📊 **Tổng quan ${offers.length} offers của bạn:**\n\n`;
      offerSummaries.forEach((o, i) => {
        response += `**${i + 1}. ${o.name}** - ${o.position}\n`;
        response += `   • Lương Gross: ${formatSalary(o.baseSalary)}\n`;
        response += `   • Lương Net: ${formatSalary(o.netSalary)}\n`;
        response += `   • Ngày phép: ${o.leave || 'N/A'} ngày\n`;
        response += `   • Remote: ${o.remote}\n`;
        response += `   • Đánh giá TB: ${o.avgRating}/5 ⭐\n`;
        response += `   • Trạng thái: ${o.status === 'negotiating' ? 'Đang deal' : o.status === 'accepted' ? 'Đã nhận' : o.status === 'declined' ? 'Từ chối' : 'Đang chờ'}\n\n`;
      });
      return response;
    }

    // Salary comparison
    if (msg.includes('lương') || msg.includes('salary') || msg.includes('thu nhập') || msg.includes('tốt nhất')) {
      const sorted = [...offerSummaries].sort((a, b) => b.baseSalary - a.baseSalary);
      let response = `💰 **So sánh mức lương:**\n\n`;
      sorted.forEach((o, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        response += `${medal} **${o.name}**: ${formatSalary(o.baseSalary)} (Gross)`;
        if (o.netSalary) response += ` / ${formatSalary(o.netSalary)} (Net)`;
        response += '\n';
      });

      if (sorted.length >= 2) {
        const diff = sorted[0].baseSalary - sorted[1].baseSalary;
        if (diff > 0) {
          response += `\n📈 Chênh lệch cao nhất - thấp nhì: **${formatSalary(diff)}**\n`;
        }
        response += `\n💡 **Lưu ý:** Lương chỉ là một phần. Hãy xem xét tổng thể: phúc lợi, văn hóa, cơ hội phát triển, work-life balance.`;
      }
      return response;
    }

    // Negotiation advice
    if (msg.includes('deal') || msg.includes('thương lượng') || msg.includes('negotiate')) {
      return `🤝 **Chiến lược thương lượng lương:**\n\n**1. Chuẩn bị:**\n• Nghiên cứu mức lương thị trường cho vị trí tương tự\n• Liệt kê thành tích và giá trị bạn mang lại\n• Xác định mức lương tối thiểu bạn chấp nhận\n\n**2. Khi thương lượng:**\n• Đừng tiết lộ mức lương hiện tại hoặc kỳ vọng trước\n• Để nhà tuyển dụng đưa con số trước\n• Nếu được hỏi, đưa ra một khoảng (range) thay vì con số cụ thể\n• Focus vào giá trị bạn mang lại, không phải nhu cầu cá nhân\n\n**3. Ngoài lương cơ bản:**\n• Signing bonus\n• Stock options/ESOP\n• Ngày phép thêm\n• Budget đào tạo\n• Flexible working hours\n• Remote work policy\n\n**4. Câu nói hay:**\n• "Dựa trên kinh nghiệm và thị trường, tôi kỳ vọng mức X-Y"\n• "Tôi rất hứng thú với vị trí này. Liệu có thể điều chỉnh package?"\n• "Nếu lương cơ bản khó thay đổi, liệu có thể xem xét các phúc lợi khác?"`;
    }

    // Pros/cons
    if (msg.includes('ưu') || msg.includes('nhược') || msg.includes('pros') || msg.includes('cons') || msg.includes('phân tích')) {
      let response = `📋 **Phân tích từng offer:**\n\n`;
      offerSummaries.forEach((o) => {
        response += `### ${o.name}\n`;

        const pros: string[] = [];
        const cons: string[] = [];

        // Salary analysis
        const maxSalary = Math.max(...offerSummaries.map((s) => s.baseSalary));
        if (o.baseSalary === maxSalary && o.baseSalary > 0) pros.push('Mức lương cao nhất');
        else if (o.baseSalary > 0 && o.baseSalary < maxSalary * 0.8) cons.push('Mức lương thấp hơn đáng kể');

        if (o.bonus13 === true) pros.push('Có thưởng tháng 13');
        if (o.leave >= 15) pros.push(`Ngày phép tốt (${o.leave} ngày)`);
        if (o.leave > 0 && o.leave < 12) cons.push(`Ít ngày phép (${o.leave} ngày)`);

        const rating = parseFloat(o.avgRating);
        if (rating >= 4) pros.push(`Đánh giá tổng hợp cao (${o.avgRating}/5)`);
        if (rating > 0 && rating < 3) cons.push(`Đánh giá tổng hợp thấp (${o.avgRating}/5)`);

        if (o.remote && o.remote !== 'N/A' && o.remote.toString().toLowerCase().includes('remote')) {
          pros.push('Hỗ trợ làm việc từ xa');
        }

        response += `✅ Ưu điểm: ${pros.length > 0 ? pros.join(', ') : 'Cần thêm thông tin'}\n`;
        response += `⚠️ Nhược điểm: ${cons.length > 0 ? cons.join(', ') : 'Cần thêm thông tin'}\n\n`;
      });

      response += `\n💡 **Gợi ý:** Điền thêm thông tin cho các tiêu chí để có phân tích chi tiết hơn.`;
      return response;
    }

    // Interview questions
    if (msg.includes('hỏi') || msg.includes('phỏng vấn') || msg.includes('interview')) {
      return `🎯 **Top câu hỏi nên hỏi khi phỏng vấn:**\n\n**Về công việc:**\n• Mô tả cụ thể công việc hàng ngày?\n• Tech stack và dự án đang ở giai đoạn nào?\n• Quy trình code review, CI/CD?\n\n**Về team:**\n• Team size và cơ cấu?\n• Phong cách quản lý của leader?\n• Tỷ lệ nghỉ việc gần đây?\n\n**Về lương thưởng:**\n• Cơ cấu lương chi tiết (Gross/Net/Phụ cấp)?\n• Chu kỳ review và mức tăng trung bình?\n• Chính sách thưởng KPI/cuối năm?\n\n**Về phát triển:**\n• Lộ trình thăng tiến?\n• Budget đào tạo, conference?\n• Chương trình mentorship?\n\n📌 Xem thêm chi tiết tại mục **"Hướng dẫn PV"**`;
    }

    // Recommendation
    if (msg.includes('chọn') || msg.includes('nên') || msg.includes('recommend') || msg.includes('khuyên')) {
      if (offerSummaries.length < 2) {
        return 'Bạn cần ít nhất 2 offer để tôi có thể đưa ra so sánh và gợi ý. Hãy thêm offer ở mục "Quản lý Offers" nhé!';
      }

      // Simple scoring
      const scored = offerSummaries.map((o) => {
        let score = 0;
        const maxSalary = Math.max(...offerSummaries.map((s) => s.baseSalary));
        if (maxSalary > 0) score += (o.baseSalary / maxSalary) * 40;
        score += parseFloat(o.avgRating) * 6; // max 30
        if (o.bonus13 === true) score += 5;
        if (o.leave >= 15) score += 5;
        score += Math.min(o.leave, 20);
        return { ...o, score: Math.round(score) };
      }).sort((a, b) => b.score - a.score);

      let response = `🏆 **Gợi ý lựa chọn (dựa trên dữ liệu hiện có):**\n\n`;
      scored.forEach((o, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
        response += `${medal} **${o.name}** - Điểm: ${o.score}/100\n`;
      });

      response += `\n⚠️ **Lưu ý quan trọng:**\n`;
      response += `• Đây chỉ là đánh giá dựa trên dữ liệu bạn đã nhập\n`;
      response += `• Nhiều yếu tố quan trọng không thể đo lường bằng số\n`;
      response += `• Hãy cân nhắc: văn hóa, cảm nhận khi PV, đồng nghiệp, sếp\n`;
      response += `• Điền đầy đủ thông tin hơn để có đánh giá chính xác hơn\n`;
      response += `\n💡 Bạn muốn tôi phân tích chi tiết hơn ở khía cạnh nào?`;
      return response;
    }

    // Default response
    return `Tôi là AI trợ lý giúp bạn phân tích và so sánh các offer. Bạn có thể hỏi tôi về:\n\n• **So sánh tổng quan** các offer\n• **Phân tích lương** và phúc lợi\n• **Ưu nhược điểm** từng offer\n• **Tư vấn thương lượng** lương\n• **Gợi ý lựa chọn** offer phù hợp\n• **Câu hỏi phỏng vấn** nên hỏi\n\nHiện bạn đang có **${offers.length} offer** trong hệ thống. Tôi sẵn sàng hỗ trợ!`;
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addChatMessage({ role: 'user', content: trimmed });
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = generateAIResponse(trimmed);
      addChatMessage({ role: 'assistant', content: response });
      setIsTyping(false);
    }, 800 + Math.random() * 700);
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles size={24} className="text-[#818cf8]" />
            AI Tư vấn
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Trợ lý thông minh giúp phân tích và tư vấn offers</p>
        </div>
        {chatMessages.length > 0 && (
          <button className="btn-secondary text-sm" onClick={clearChat}>
            <Trash2 size={14} /> Xóa lịch sử
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {chatMessages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[rgba(99,102,241,0.1)] flex items-center justify-center mx-auto mb-4">
              <Bot size={28} className="text-[#818cf8]" />
            </div>
            <h3 className="text-lg font-medium mb-2">Xin chào! 👋</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-md mx-auto">
              Tôi là AI trợ lý, sẵn sàng giúp bạn phân tích, so sánh và đưa ra quyết định về các offer.
            </p>

            {/* Suggested Prompts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[rgba(99,102,241,0.3)] hover:text-[#818cf8] transition-all"
                >
                  <Lightbulb size={12} /> {prompt}
                </button>
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
              <div className="w-8 h-8 rounded-lg bg-[rgba(99,102,241,0.15)] flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-[#818cf8]" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[rgba(99,102,241,0.2)] text-white rounded-br-md'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-bl-md'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-[rgba(236,72,153,0.15)] flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-[#ec4899]" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-[rgba(99,102,241,0.15)] flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-[#818cf8]" />
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#818cf8] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#818cf8] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#818cf8] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-card p-3 flex gap-3 items-end">
        <textarea
          ref={inputRef}
          className="flex-1 bg-transparent border-none outline-none text-sm resize-none placeholder:text-[var(--text-muted)]"
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
        <button
          className={`p-2.5 rounded-lg transition-all ${
            input.trim()
              ? 'bg-[#6366f1] text-white hover:bg-[#818cf8]'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
          }`}
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
