'use client';

import { useState } from 'react';
import { INTERVIEW_QUESTIONS } from '@/data/criteria';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
        return <AlertCircle size={14} className="text-destructive" />;
      case 'medium':
        return <AlertTriangle size={14} className="text-chart-4" />;
      default:
        return <Info size={14} className="text-chart-5" />;
    }
  };

  const importanceBadge = (importance: string) => {
    switch (importance) {
      case 'high':
        return (
          <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/20">
            Quan trọng
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary" className="bg-chart-4/15 text-chart-4 hover:bg-chart-4/20">
            Nên hỏi
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-chart-5/15 text-chart-5 hover:bg-chart-5/20">
            Tham khảo
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hướng dẫn phỏng vấn</h1>
        <p className="text-muted-foreground mt-1">
          Các câu hỏi quan trọng nên hỏi khi phỏng vấn và nhận offer
        </p>
      </div>

      {/* Tips Banner */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-5">
          <div className="flex gap-3">
            <BookOpen size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-2">Mẹo khi phỏng vấn</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Luôn chuẩn bị câu hỏi trước khi đến phỏng vấn</li>
                <li>• Hỏi về team và người quản lý trực tiếp</li>
                <li>• Tìm hiểu văn hóa công ty qua Glassdoor, LinkedIn</li>
                <li>• Ghi chú lại câu trả lời để so sánh sau này</li>
                <li>• Đừng ngại hỏi về lương thưởng và phúc lợi - đây là quyền lợi của bạn</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Tìm kiếm câu hỏi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'high', label: 'Quan trọng' },
            { key: 'medium', label: 'Nên hỏi' },
            { key: 'low', label: 'Tham khảo' },
          ].map((level) => (
            <Button
              key={level.key}
              variant={filterImportance === level.key ? 'secondary' : 'outline'}
              size="sm"
              className={filterImportance === level.key ? 'bg-primary/15 text-primary' : ''}
              onClick={() => setFilterImportance(level.key)}
            >
              {level.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {expandedCategories.size === categories.length ? 'Thu gọn' : 'Mở rộng'}
          </Button>
        </div>
      </div>

      {/* Questions by Category */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const catQuestions = filteredQuestions.filter((q) => q.category === cat);
          if (catQuestions.length === 0) return null;
          const isExpanded = expandedCategories.has(cat);

          return (
            <Collapsible
              key={cat}
              open={isExpanded}
              onOpenChange={() => toggleCategory(cat)}
            >
              <Card>
                <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors rounded-lg">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={18} className="text-muted-foreground" />
                    )}
                    <h3 className="font-semibold">{cat}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {catQuestions.length} câu hỏi
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {catQuestions.some((q) => q.importance === 'high') && (
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                    )}
                    {catQuestions.some((q) => q.importance === 'medium') && (
                      <span className="w-2 h-2 rounded-full bg-chart-4" />
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-2">
                    {catQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="mt-0.5">{importanceIcon(q.importance)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">{q.question}</p>
                          <p className="text-xs text-muted-foreground">{q.description}</p>
                        </div>
                        {importanceBadge(q.importance)}
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {filteredQuestions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Không tìm thấy câu hỏi phù hợp</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
