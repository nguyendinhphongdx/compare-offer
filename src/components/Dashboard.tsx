'use client';

import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/data/criteria';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  TrendingUp,
  GitCompareArrows,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';

export default function Dashboard() {
  const { offers, criteria } = useStore();

  const statusCounts = {
    pending: offers.filter((o) => o.status === 'pending').length,
    negotiating: offers.filter((o) => o.status === 'negotiating').length,
    accepted: offers.filter((o) => o.status === 'accepted').length,
    declined: offers.filter((o) => o.status === 'declined').length,
  };

  const highestOffer = offers.reduce((max, offer) => {
    const salary = offer.values.find((v) => v.criterionId === 'base_salary');
    const currentMax = max?.values.find((v) => v.criterionId === 'base_salary');
    if (!salary) return max;
    if (!currentMax) return offer;
    return Number(salary.value) > Number(currentMax.value) ? offer : max;
  }, offers[0]);

  const categoryStats = Object.keys(CATEGORY_LABELS)
    .filter((c) => c !== 'custom')
    .map((cat) => {
      const catCriteria = criteria.filter((c) => c.category === cat);
      const filledCount = offers.reduce((acc, offer) => {
        return (
          acc +
          catCriteria.filter((c) =>
            offer.values.some((v) => v.criterionId === c.id && v.value !== '' && v.value !== 0)
          ).length
        );
      }, 0);
      const totalPossible = catCriteria.length * offers.length;
      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        color: CATEGORY_COLORS[cat],
        percentage: totalPossible > 0 ? Math.round((filledCount / totalPossible) * 100) : 0,
      };
    });

  const formatSalary = (val: string | number | boolean | undefined) => {
    if (!val) return 'N/A';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return new Intl.NumberFormat('vi-VN').format(num) + ' VNĐ';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground mt-1 text-sm">Quản lý và theo dõi các offer của bạn</p>
        </div>
        <Link href="/offers" className="shrink-0">
          <Button size="sm" className="sm:size-default">
            <Plus size={16} /> <span className="hidden sm:inline">Thêm Offer</span><span className="sm:hidden">Thêm</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Tổng Offers</span>
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <FileText size={18} className="text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold">{offers.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{criteria.length} tiêu chí đánh giá</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Đang thương lượng</span>
              <div className="w-9 h-9 rounded-lg bg-chart-4/15 flex items-center justify-center">
                <Clock size={18} className="text-chart-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-chart-4">{statusCounts.negotiating}</p>
            <p className="text-xs text-muted-foreground mt-1">{statusCounts.pending} đang chờ</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Offer cao nhất</span>
              <div className="w-9 h-9 rounded-lg bg-chart-3/15 flex items-center justify-center">
                <TrendingUp size={18} className="text-chart-3" />
              </div>
            </div>
            <p className="text-xl font-bold text-chart-3">
              {highestOffer
                ? formatSalary(highestOffer.values.find((v) => v.criterionId === 'base_salary')?.value)
                : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {highestOffer?.companyName || 'Chưa có offer'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Đã chấp nhận</span>
              <div className="w-9 h-9 rounded-lg bg-chart-3/15 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-chart-3" />
              </div>
            </div>
            <p className="text-3xl font-bold">{statusCounts.accepted}</p>
            <p className="text-xs text-muted-foreground mt-1">{statusCounts.declined} đã từ chối</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Offers */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Offers gần đây</CardTitle>
            <Link href="/offers" className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileText size={28} className="text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Chưa có offer nào</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Bắt đầu thêm các offer để so sánh và phân tích
                </p>
                <Link href="/offers">
                  <Button>
                    <Plus size={16} /> Thêm offer đầu tiên
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {offers.slice(0, 5).map((offer, idx) => {
                  const baseSalary = offer.values.find((v) => v.criterionId === 'base_salary');
                  return (
                    <Link
                      key={offer.id}
                      href="/offers"
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: offer.color }}
                      >
                        {offer.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{offer.companyName}</p>
                        <p className="text-sm text-muted-foreground truncate">{offer.position}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-semibold text-sm">{formatSalary(baseSalary?.value)}</p>
                        <Badge
                          variant={
                            offer.status === 'accepted'
                              ? 'default'
                              : offer.status === 'declined'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            offer.status === 'current'
                              ? 'bg-chart-5/20 text-chart-5 hover:bg-chart-5/30'
                              : offer.status === 'accepted'
                              ? 'bg-chart-3/20 text-chart-3 hover:bg-chart-3/30'
                              : offer.status === 'negotiating'
                              ? 'bg-chart-4/20 text-chart-4 hover:bg-chart-4/30'
                              : offer.status === 'declined'
                              ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                              : ''
                          }
                        >
                          {offer.status === 'current'
                            ? 'Hiện tại'
                            : offer.status === 'pending'
                            ? 'Đang chờ'
                            : offer.status === 'negotiating'
                            ? 'Đang deal'
                            : offer.status === 'accepted'
                            ? 'Đã nhận'
                            : 'Từ chối'}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tiến độ đánh giá</CardTitle>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Thêm offer để xem tiến độ đánh giá
              </p>
            ) : (
              <div className="space-y-5">
                {categoryStats.map((stat) => (
                  <div key={stat.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{stat.label}</span>
                      <span className="text-xs text-muted-foreground">{stat.percentage}%</span>
                    </div>
                    <Progress value={stat.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/compare">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group h-full">
            <CardContent className="pt-6">
              <GitCompareArrows
                size={24}
                className="text-primary mb-3 group-hover:scale-110 transition-transform"
              />
              <h3 className="font-semibold mb-1">So sánh Offers</h3>
              <p className="text-sm text-muted-foreground">So sánh chi tiết giữa các offer</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/interview">
          <Card className="cursor-pointer hover:border-chart-2/50 transition-colors group h-full">
            <CardContent className="pt-6">
              <HelpCircle
                size={24}
                className="text-chart-2 mb-3 group-hover:scale-110 transition-transform"
              />
              <h3 className="font-semibold mb-1">Hướng dẫn phỏng vấn</h3>
              <p className="text-sm text-muted-foreground">Các câu hỏi nên hỏi khi PV</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/assistant">
          <Card className="cursor-pointer hover:border-chart-5/50 transition-colors group h-full">
            <CardContent className="pt-6">
              <MessageCircle
                size={24}
                className="text-chart-5 mb-3 group-hover:scale-110 transition-transform"
              />
              <h3 className="font-semibold mb-1">AI Tư vấn</h3>
              <p className="text-sm text-muted-foreground">Nhờ AI phân tích và tư vấn</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
