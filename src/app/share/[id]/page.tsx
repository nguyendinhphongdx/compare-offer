'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DEFAULT_CRITERIA, CATEGORY_LABELS, CATEGORY_COLORS } from '@/data/criteria';
import StarRating from '@/components/StarRating';
import { Card, CardContent } from '@/components/ui/card';
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
import { CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Briefcase, TrendingUp, Trophy } from 'lucide-react';
import type { Offer, Criterion, CriterionValue } from '@/types';

interface SharedData {
  id: string;
  title: string;
  offers: Offer[];
  criteria: Array<{ id: string; name: string; category: string; type: string; description?: string }>;
  createdAt: string;
}

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

export default function SharedComparePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/share/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Không tìm thấy bài so sánh' : 'Link đã hết hạn hoặc không hợp lệ');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Đang tải...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Không thể mở bài so sánh</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const offers = data.offers as Offer[];

  // Merge default criteria with custom criteria from shared data
  const customCriteria: Criterion[] = (data.criteria || []).map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category as Criterion['category'],
    description: c.description || '',
    type: c.type as Criterion['type'],
    isCustom: true,
  }));
  const allCriteria = [...DEFAULT_CRITERIA, ...customCriteria];

  // Only show criteria that have at least one value across offers
  const usedCriteriaIds = new Set<string>();
  offers.forEach((o) => {
    (o.values || []).forEach((v: CriterionValue) => {
      if (v.value !== undefined && v.value !== '' && v.value !== 0) {
        usedCriteriaIds.add(v.criterionId);
      }
    });
  });

  const activeCriteria = allCriteria.filter((c) => usedCriteriaIds.has(c.id));

  const groupedCriteria = Object.entries(CATEGORY_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      color: CATEGORY_COLORS[key],
      items: activeCriteria.filter((c) => c.category === key),
    }))
    .filter((g) => g.items.length > 0);

  const getOfferValue = (offer: Offer, criterionId: string) => {
    const v = (offer.values || []).find((v: CriterionValue) => v.criterionId === criterionId);
    return Number(v?.value || 0);
  };

  const calcAnnualPackage = (offer: Offer) => {
    const grossMonthly = getOfferValue(offer, 'base_salary');
    const has13th = (offer.values || []).find((v: CriterionValue) => v.criterionId === 'bonus_13th')?.value === true;
    const performanceBonus = getOfferValue(offer, 'performance_bonus');
    const signingBonus = getOfferValue(offer, 'signing_bonus');
    const months = has13th ? 13 : 12;
    const annualBase = grossMonthly * months;
    const total = annualBase + performanceBonus + signingBonus;
    return { grossMonthly, months, annualBase, performanceBonus, signingBonus, total };
  };

  const formatVND = (num: number) => {
    if (num === 0) return '—';
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
  };

  const getSalaryComparison = (criterionId: string) => {
    const values = offers
      .map((o) => {
        const v = (o.values || []).find((v: CriterionValue) => v.criterionId === criterionId);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase size={18} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">OfferLens</h1>
            <p className="text-xs text-muted-foreground">Chia sẻ bài so sánh</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{data.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo ngày {new Date(data.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Annual Package Comparison */}
        {(() => {
          const packages = offers.map((offer) => ({
            offer,
            ...calcAnnualPackage(offer),
          }));
          const maxTotal = Math.max(...packages.map((p) => p.total));
          const hasPackageData = packages.some((p) => p.total > 0);
          const winner = packages.find((p) => p.total === maxTotal && p.total > 0);

          if (!hasPackageData) return null;

          return (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp size={18} className="text-chart-3" />
                  So sánh Package cả năm
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                          <TableCell className="font-bold text-primary">Tổng Package/năm</TableCell>
                          {packages.map((pkg) => {
                            const isMax = pkg.total === maxTotal && pkg.total > 0 && packages.filter((p) => p.total > 0).length >= 2;
                            return (
                              <TableCell key={pkg.offer.id} className={`text-center font-bold ${isMax ? 'text-chart-3' : ''}`}>
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
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Comparison Table */}
        <Card>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px] sticky left-0 bg-card z-10">
                    Tiêu chí
                  </TableHead>
                  {offers.map((offer) => (
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
                        colSpan={offers.length + 1}
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
                          {offers.map((offer) => {
                            const val = (offer.values || []).find(
                              (v: CriterionValue) => v.criterionId === criterion.id
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
      </div>
    </div>
  );
}
