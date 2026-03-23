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
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function CompareView() {
  const {
    offers,
    criteria,
    selectedOfferIds,
    toggleOfferSelection,
    selectAllOffers,
    clearSelection,
  } = useStore();

  const selectedOffers = offers.filter((o) => selectedOfferIds.includes(o.id));

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">So sánh Offers</h1>
        <p className="text-muted-foreground mt-1">Chọn các offer để so sánh chi tiết</p>
      </div>

      {/* Offer Selection */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
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
