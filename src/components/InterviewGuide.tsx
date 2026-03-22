'use client';

import { useState } from 'react';
import { INTERVIEW_QUESTIONS } from '@/data/criteria';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Search,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export default function InterviewGuide() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filterImportance, setFilterImportance] = useState<string>('all');

  const categories = [...new Set(INTERVIEW_QUESTIONS.map((q) => q.category))];

  const filteredQuestions = INTERVIEW_QUESTIONS.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesImportance = filterImportance === 'all' || q.importance === filterImportance;
    return matchesSearch && matchesImportance;
  });

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  const toggleAll = () => {
    if (expandedCategories.size === categories.length) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(categories));
    }
  };

  const importanceIcon = (importance: string) => {
    switch (importance) {
      case 'high':
        return <AlertCircle size={14} className="text-[#ef4444]" />;
      case 'medium':
        return <AlertTriangle size={14} className="text-[#f59e0b]" />;
      default:
        return <Info size={14} className="text-[#06b6d4]" />;
    }
  };

  const importanceBadge = (importance: string) => {
    switch (importance) {
      case 'high':
        return <span className="badge badge-danger text-xs">Quan trọng</span>;
      case 'medium':
        return <span className="badge badge-warning text-xs">Nên hỏi</span>;
      default:
        return <span className="badge badge-info text-xs">Tham khảo</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Hướng dẫn phỏng vấn</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Các câu hỏi quan trọng nên hỏi khi phỏng vấn và nhận offer
        </p>
      </div>

      {/* Tips Banner */}
      <div
        className="glass-card p-5"
        style={{ borderLeft: '3px solid #6366f1' }}
      >
        <div className="flex gap-3">
          <BookOpen size={20} className="text-[#818cf8] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm mb-1">Mẹo khi phỏng vấn</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Luôn chuẩn bị câu hỏi trước khi đến phỏng vấn</li>
              <li>• Hỏi về team và người quản lý trực tiếp</li>
              <li>• Tìm hiểu văn hóa công ty qua Glassdoor, LinkedIn</li>
              <li>• Ghi chú lại câu trả lời để so sánh sau này</li>
              <li>• Đừng ngại hỏi về lương thưởng và phúc lợi - đây là quyền lợi của bạn</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="input-field pl-10"
            placeholder="Tìm kiếm câu hỏi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'high', 'medium', 'low'].map((level) => (
            <button
              key={level}
              onClick={() => setFilterImportance(level)}
              className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                filterImportance === level
                  ? 'bg-[rgba(99,102,241,0.2)] text-[#818cf8] border-[rgba(99,102,241,0.3)]'
                  : 'text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[rgba(99,102,241,0.3)]'
              }`}
            >
              {level === 'all' ? 'Tất cả' : level === 'high' ? 'Quan trọng' : level === 'medium' ? 'Nên hỏi' : 'Tham khảo'}
            </button>
          ))}
          <button className="btn-secondary text-sm py-2" onClick={toggleAll}>
            {expandedCategories.size === categories.length ? 'Thu gọn' : 'Mở rộng'}
          </button>
        </div>
      </div>

      {/* Questions by Category */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const catQuestions = filteredQuestions.filter((q) => q.category === cat);
          if (catQuestions.length === 0) return null;
          const isExpanded = expandedCategories.has(cat);

          return (
            <div key={cat} className="glass-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-[rgba(51,65,85,0.3)] transition-all"
                onClick={() => toggleCategory(cat)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <h3 className="font-semibold">{cat}</h3>
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full">
                    {catQuestions.length} câu hỏi
                  </span>
                </div>
                <div className="flex gap-1">
                  {catQuestions.filter((q) => q.importance === 'high').length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                  )}
                  {catQuestions.filter((q) => q.importance === 'medium').length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[var(--border-color)] p-4 space-y-3 animate-fade-in">
                  {catQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="flex gap-3 p-3 rounded-lg bg-[rgba(15,23,42,0.5)] hover:bg-[rgba(15,23,42,0.8)] transition-all animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="mt-0.5">{importanceIcon(q.importance)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">{q.question}</p>
                        <p className="text-xs text-[var(--text-muted)]">{q.description}</p>
                      </div>
                      {importanceBadge(q.importance)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-[var(--text-secondary)]">Không tìm thấy câu hỏi phù hợp</p>
        </div>
      )}
    </div>
  );
}
