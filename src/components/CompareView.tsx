'use client';

import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/data/criteria';
import StarRating from './StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, ArrowRight, Globe, Copy, Check, Loader2, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Streamdown } from 'streamdown';
import { mermaid } from '@streamdown/mermaid';
import { code } from '@streamdown/code';

const SCHEDULE_LABELS: Record<string, string> = {
  mon_fri: 'T2 - T6',
  mon_sat_half: 'T2 - Sáng T7',
  mon_sat: 'T2 - T7',
  shift: 'Ca kíp',
  other: 'Khác',
};

export default function CompareView() {
  const {
    offers,
    criteria,
    selectedOfferIds,
    toggleOfferSelection,
    selectAllOffers,
    clearSelection,
  } = useStore();

  const [publishing, setPublishing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const selectedOffers = offers.filter((o) => selectedOfferIds.includes(o.id));

  const buildEvalContext = useCallback(() => {
    const lines: string[] = [`So sánh ${selectedOffers.length} offers:\n`];
    selectedOffers.forEach((offer, i) => {
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
        if (criterion) {
          const cat = CATEGORY_LABELS[criterion.category] || criterion.category;
          if (!grouped[cat]) grouped[cat] = [];
          let displayVal: string;
          if (criterion.type === 'salary') displayVal = new Intl.NumberFormat('vi-VN').format(Number(val.value)) + ' VNĐ';
          else if (criterion.type === 'boolean') displayVal = val.value ? 'Có' : 'Không';
          else if (criterion.type === 'rating') displayVal = `${val.value}/5`;
          else if (criterion.type === 'work_schedule') displayVal = SCHEDULE_LABELS[String(val.value)] || String(val.value);
          else displayVal = String(val.value);
          grouped[cat].push(`  ${criterion.name}: ${displayVal}${val.note ? ` (Ghi chú: ${val.note})` : ''}`);
        } else if (val.criterionId === '_compensation_note' && val.value) {
          if (!grouped['Ghi chú lương thưởng']) grouped['Ghi chú lương thưởng'] = [];
          grouped['Ghi chú lương thưởng'].push(`  ${val.value}`);
        }
      }
      for (const [cat, items] of Object.entries(grouped)) {
        lines.push(`[${cat}]`);
        lines.push(...items);
      }
      lines.push('');
    });
    return lines.join('\n');
  }, [selectedOffers, criteria]);

  const handleAiEvaluate = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: buildEvalContext() }),
      });
      if (!res.ok) throw new Error('API error');
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = '';
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                result += parsed.text;
                setAiResult(result);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setAiResult('Không thể kết nối AI. Vui lòng thử lại.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublish = async () => {
    if (selectedOffers.length < 2) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerIds: selectedOffers.map((o) => o.id),
          aiEvaluation: aiResult || null,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setShareUrl(`${window.location.origin}/share/${data.id}`);
      }
    } catch {
      // silently fail
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOfferValue = (offer: typeof offers[0], criterionId: string) => {
    const v = offer.values.find((v) => v.criterionId === criterionId);
    return Number(v?.value || 0);
  };

  const calcAnnualPackage = (offer: typeof offers[0]) => {
    const grossMonthly = getOfferValue(offer, 'base_salary');
    const has13th = offer.values.find((v) => v.criterionId === 'bonus_13th')?.value === true;
    const performanceBonus = getOfferValue(offer, 'performance_bonus');
    const signingBonus = getOfferValue(offer, 'signing_bonus');

    const months = has13th ? 13 : 12;
    const annualBase = grossMonthly * months;
    const total = annualBase + performanceBonus + signingBonus;

    return {
      grossMonthly,
      months,
      annualBase,
      performanceBonus,
      signingBonus,
      total,
    };
  };

  const formatVND = (num: number) => {
    if (num === 0) return '—';
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
  };

  const groupedCriteria = Object.entries(CATEGORY_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      color: CATEGORY_COLORS[key],
      items: criteria.filter((c) => c.category === key),
    }))
    .filter((g) => g.items.length > 0);

  const formatValue = (val: string | number | boolean | undefined, type: string) => {
    if (val === undefined || val === '' || val === 0) return '—';
    if (type === 'salary') {
      const num = Number(val);
      if (isNaN(num)) return String(val);
      return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
    }
    if (type === 'boolean') return val ? 'Có' : 'Không';
    if (type === 'work_schedule') {
      const map: Record<string, string> = {
        mon_fri: '🟢 T2 - T6',
        mon_sat_half: '🟡 T2 - Sáng T7',
        mon_sat: '🔴 T2 - T7',
        shift: '🔵 Ca kíp',
        other: '⚪ Khác',
      };
      return map[String(val)] || String(val);
    }
    return String(val);
  };

  const getSalaryComparison = (criterionId: string) => {
    const values = selectedOffers
      .map((o) => {
        const v = o.values.find((v) => v.criterionId === criterionId);
        return { offerId: o.id, value: Number(v?.value || 0) };
      })
      .filter((v) => v.value > 0);

    if (values.length < 2) return null;
    const max = Math.max(...values.map((v) => v.value));
    return values.reduce(
      (acc, v) => {
        acc[v.offerId] = v.value === max ? 'highest' : 'lower';
        return acc;
      },
      {} as Record<string, string>
    );
  };

  if (offers.length < 2) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight mb-2">So sánh Offers</h1>
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Cần ít nhất 2 offers để so sánh</h3>
            <p className="text-muted-foreground mb-4">
              Bạn hiện có {offers.length} offer. Hãy thêm offer để bắt đầu so sánh.
            </p>
            <Link href="/offers">
              <Button>
                Thêm Offer <ArrowRight size={16} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">So sánh Offers</h1>
          <p className="text-muted-foreground mt-1 text-sm">Chọn các offer để so sánh chi tiết</p>
        </div>
        {selectedOffers.length >= 2 && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={shareUrl ? 'default' : 'outline'}
              size="sm"
              onClick={handlePublish}
              disabled={publishing}
              className={shareUrl ? 'bg-chart-3 hover:bg-chart-3/90' : ''}
            >
              {publishing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Globe size={16} />
              )}
              {publishing ? 'Đang...' : shareUrl ? 'Đã public' : 'Public'}
            </Button>
            {shareUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className={copied ? 'text-chart-3 border-chart-3/50' : ''}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Đã copy!' : 'Copy'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Offer Selection */}
      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="text-base">Chọn offers để so sánh</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAllOffers}>
              Chọn tất cả
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Bỏ chọn
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {offers.map((offer) => {
              const isSelected = selectedOfferIds.includes(offer.id);
              return (
                <Button
                  key={offer.id}
                  variant={isSelected ? 'secondary' : 'outline'}
                  className={`gap-2 ${
                    isSelected ? 'border-primary/50 bg-primary/10' : ''
                  }`}
                  onClick={() => toggleOfferSelection(offer.id)}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: offer.color }}
                  >
                    {offer.companyName.charAt(0)}
                  </div>
                  {offer.companyName}
                  {isSelected && <CheckCircle2 size={14} className="text-primary" />}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Annual Package Comparison */}
      {selectedOffers.length >= 2 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-chart-3" />
              So sánh Package cả năm
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const packages = selectedOffers.map((offer) => ({
                offer,
                ...calcAnnualPackage(offer),
              }));
              const maxTotal = Math.max(...packages.map((p) => p.total));
              const winner = packages.find((p) => p.total === maxTotal && p.total > 0);

              return (
                <div className="space-y-5">
                  {/* Visual bar comparison */}
                  <div className="space-y-3">
                    {packages.map((pkg) => {
                      const pct = maxTotal > 0 ? (pkg.total / maxTotal) * 100 : 0;
                      const isWinner = pkg.total === maxTotal && pkg.total > 0;
                      return (
                        <div key={pkg.offer.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                style={{ background: pkg.offer.color }}
                              >
                                {pkg.offer.companyName.charAt(0)}
                              </div>
                              <span className="font-medium">{pkg.offer.companyName}</span>
                              {isWinner && packages.filter((p) => p.total > 0).length >= 2 && (
                                <Badge variant="secondary" className="bg-chart-3/20 text-chart-3 text-xs gap-1">
                                  <Trophy size={10} /> Cao nhất
                                </Badge>
                              )}
                            </div>
                            <span className={`font-bold ${isWinner ? 'text-chart-3' : ''}`}>
                              {formatVND(pkg.total)}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: pkg.offer.color,
                                opacity: isWinner ? 1 : 0.6,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Breakdown table */}
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[180px]">Thành phần</TableHead>
                          {packages.map((pkg) => (
                            <TableHead key={pkg.offer.id} className="text-center min-w-[150px]">
                              {pkg.offer.companyName}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Lương Gross/tháng</TableCell>
                          {packages.map((pkg) => (
                            <TableCell key={pkg.offer.id} className="text-center">
                              {formatVND(pkg.grossMonthly)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Số tháng lương</TableCell>
                          {packages.map((pkg) => (
                            <TableCell key={pkg.offer.id} className="text-center">
                              {pkg.grossMonthly > 0 ? (
                                <span>
                                  {pkg.months} tháng
                                  {pkg.months === 13 && (
                                    <Badge variant="secondary" className="ml-1 bg-chart-3/20 text-chart-3 text-xs">
                                      +T13
                                    </Badge>
                                  )}
                                </span>
                              ) : '—'}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Lương cả năm</TableCell>
                          {packages.map((pkg) => (
                            <TableCell key={pkg.offer.id} className="text-center font-medium">
                              {formatVND(pkg.annualBase)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Thưởng hiệu suất</TableCell>
                          {packages.map((pkg) => (
                            <TableCell key={pkg.offer.id} className="text-center">
                              {formatVND(pkg.performanceBonus)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Signing Bonus</TableCell>
                          {packages.map((pkg) => (
                            <TableCell key={pkg.offer.id} className="text-center">
                              {formatVND(pkg.signingBonus)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30 font-bold">
                          <TableCell className="font-bold text-primary">
                            Tổng Package/năm
                          </TableCell>
                          {packages.map((pkg) => {
                            const isMax = pkg.total === maxTotal && pkg.total > 0 && packages.filter((p) => p.total > 0).length >= 2;
                            return (
                              <TableCell
                                key={pkg.offer.id}
                                className={`text-center font-bold ${isMax ? 'text-chart-3' : ''}`}
                              >
                                {formatVND(pkg.total)}
                                {isMax && (
                                  <Badge variant="secondary" className="ml-1 bg-chart-3/20 text-chart-3 text-xs">
                                    Cao nhất
                                  </Badge>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                        {/* Difference row */}
                        {winner && packages.filter((p) => p.total > 0).length >= 2 && (
                          <TableRow>
                            <TableCell className="text-muted-foreground text-xs">
                              Chênh lệch so với cao nhất
                            </TableCell>
                            {packages.map((pkg) => {
                              const diff = pkg.total - maxTotal;
                              return (
                                <TableCell key={pkg.offer.id} className="text-center text-xs">
                                  {pkg.total === maxTotal ? (
                                    <span className="text-chart-3">—</span>
                                  ) : pkg.total > 0 ? (
                                    <span className="text-destructive">
                                      {formatVND(diff)} ({((diff / maxTotal) * 100).toFixed(1)}%)
                                    </span>
                                  ) : '—'}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        )}
                        {/* Compensation notes row */}
                        {packages.some((pkg) => pkg.offer.values.find((v) => v.criterionId === '_compensation_note' && v.value)) && (
                          <TableRow>
                            <TableCell className="text-muted-foreground text-xs align-top">
                              Ghi chú
                            </TableCell>
                            {packages.map((pkg) => {
                              const note = pkg.offer.values.find((v) => v.criterionId === '_compensation_note')?.value;
                              return (
                                <TableCell key={pkg.offer.id} className="text-xs text-muted-foreground whitespace-pre-line">
                                  {note ? String(note) : '—'}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      {selectedOffers.length >= 2 && (
        <Card>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px] sticky left-0 bg-card z-10">
                    Tiêu chí
                  </TableHead>
                  {selectedOffers.map((offer) => (
                    <TableHead key={offer.id} className="text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                          style={{ background: offer.color }}
                        >
                          {offer.companyName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{offer.companyName}</p>
                          <p className="text-xs text-muted-foreground font-normal">
                            {offer.position}
                          </p>
                          {offer.status === 'current' && (
                            <Badge variant="secondary" className="mt-1 bg-chart-5/20 text-chart-5 text-xs">
                              Hiện tại
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedCriteria.map((group) => (
                  <>
                    <TableRow key={group.key} className="bg-muted/30">
                      <TableCell
                        colSpan={selectedOffers.length + 1}
                        className="font-semibold text-sm"
                        style={{ color: group.color }}
                      >
                        {group.label}
                      </TableCell>
                    </TableRow>
                    {group.items.map((criterion) => {
                      const salaryComp =
                        criterion.type === 'salary' || criterion.type === 'number'
                          ? getSalaryComparison(criterion.id)
                          : null;

                      return (
                        <TableRow key={criterion.id}>
                          <TableCell className="font-medium sticky left-0 bg-card z-10">
                            {criterion.name}
                          </TableCell>
                          {selectedOffers.map((offer) => {
                            const val = offer.values.find(
                              (v) => v.criterionId === criterion.id
                            );
                            const isHighest = salaryComp?.[offer.id] === 'highest';

                            return (
                              <TableCell key={offer.id} className="text-center">
                                {criterion.type === 'rating' ? (
                                  <div className="flex justify-center">
                                    <StarRating
                                      value={Number(val?.value || 0)}
                                      readonly
                                      size={14}
                                    />
                                  </div>
                                ) : criterion.type === 'boolean' ? (
                                  <span className="flex justify-center">
                                    {val?.value === true ? (
                                      <CheckCircle2 size={18} className="text-chart-3" />
                                    ) : val?.value === false ? (
                                      <XCircle size={18} className="text-destructive" />
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </span>
                                ) : (
                                  <span className={isHighest ? 'text-chart-3 font-semibold' : ''}>
                                    {formatValue(val?.value, criterion.type)}
                                    {isHighest && (
                                      <Badge
                                        variant="secondary"
                                        className="ml-1 bg-chart-3/20 text-chart-3 text-xs"
                                      >
                                        Cao nhất
                                      </Badge>
                                    )}
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>
      )}

      {/* AI Evaluation Section */}
      {selectedOffers.length >= 2 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles size={18} className="text-chart-4" />
              AI Đánh giá
            </CardTitle>
            <Button
              variant={aiResult ? 'outline' : 'default'}
              size="sm"
              onClick={handleAiEvaluate}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {aiLoading ? 'Đang phân tích...' : aiResult ? 'Đánh giá lại' : 'Bắt đầu đánh giá'}
            </Button>
          </CardHeader>
          <CardContent>
            {!aiResult && !aiLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                AI sẽ phân tích toàn bộ dữ liệu, tiêu chí, ghi chú của các offer được chọn và đưa ra đánh giá tổng quan.
              </p>
            )}
            {(aiResult || aiLoading) && (
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <Streamdown plugins={{ mermaid, code }} mermaid={{ config: { theme: 'dark' } }}>
                  {aiResult || ''}
                </Streamdown>
                {aiLoading && !aiResult && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                    <Loader2 size={14} className="animate-spin" />
                    Đang phân tích dữ liệu...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedOffers.length < 2 && selectedOffers.length > 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Chọn thêm ít nhất 1 offer nữa để so sánh</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
