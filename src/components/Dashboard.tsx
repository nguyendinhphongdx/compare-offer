'use client';

import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/data/criteria';
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
  const { offers, criteria, setCurrentPage } = useStore();

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

  const categoryStats = Object.keys(CATEGORY_LABELS).filter(c => c !== 'custom').map((cat) => {
    const catCriteria = criteria.filter((c) => c.category === cat);
    const filledCount = offers.reduce((acc, offer) => {
      return acc + catCriteria.filter((c) => offer.values.some((v) => v.criterionId === c.id && v.value !== '' && v.value !== 0)).length;
    }, 0);
    const totalPossible = catCriteria.length * offers.length;
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      color: CATEGORY_COLORS[cat],
      filled: filledCount,
      total: totalPossible,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-[var(--text-secondary)] mt-1">Quản lý và theo dõi các offer của bạn</p>
        </div>
        <button className="btn-primary" onClick={() => setCurrentPage('offers')}>
          <Plus size={18} /> Thêm Offer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-sm">Tổng Offers</span>
            <div className="w-9 h-9 rounded-lg bg-[rgba(99,102,241,0.15)] flex items-center justify-center">
              <FileText size={18} className="text-[#818cf8]" />
            </div>
          </div>
          <p className="text-3xl font-bold">{offers.length}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{criteria.length} tiêu chí đánh giá</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-sm">Đang thương lượng</span>
            <div className="w-9 h-9 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
              <Clock size={18} className="text-[#f59e0b]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#f59e0b]">{statusCounts.negotiating}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{statusCounts.pending} đang chờ</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-sm">Offer cao nhất</span>
            <div className="w-9 h-9 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
              <TrendingUp size={18} className="text-[#10b981]" />
            </div>
          </div>
          <p className="text-xl font-bold text-[#10b981]">
            {highestOffer ? formatSalary(highestOffer.values.find((v) => v.criterionId === 'base_salary')?.value) : 'N/A'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{highestOffer?.companyName || 'Chưa có offer'}</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-sm">Đã chấp nhận</span>
            <div className="w-9 h-9 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
              <CheckCircle2 size={18} className="text-[#10b981]" />
            </div>
          </div>
          <p className="text-3xl font-bold">{statusCounts.accepted}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{statusCounts.declined} đã từ chối</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Offers */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Offers gần đây</h2>
            <button
              className="text-sm text-[#818cf8] hover:text-[#a5b4fc] flex items-center gap-1"
              onClick={() => setCurrentPage('offers')}
            >
              Xem tất cả <ArrowRight size={14} />
            </button>
          </div>

          {offers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[rgba(99,102,241,0.1)] flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-[#818cf8]" />
              </div>
              <h3 className="text-lg font-medium mb-2">Chưa có offer nào</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                Bắt đầu thêm các offer để so sánh và phân tích
              </p>
              <button className="btn-primary" onClick={() => setCurrentPage('offers')}>
                <Plus size={16} /> Thêm offer đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.slice(0, 5).map((offer, idx) => {
                const baseSalary = offer.values.find((v) => v.criterionId === 'base_salary');
                return (
                  <div
                    key={offer.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[rgba(51,65,85,0.3)] transition-all cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => setCurrentPage('offers')}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                      style={{ background: offer.color }}
                    >
                      {offer.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{offer.companyName}</p>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{offer.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatSalary(baseSalary?.value)}</p>
                      <span
                        className={`badge text-xs ${
                          offer.status === 'accepted'
                            ? 'badge-success'
                            : offer.status === 'negotiating'
                            ? 'badge-warning'
                            : offer.status === 'declined'
                            ? 'badge-danger'
                            : 'badge-info'
                        }`}
                      >
                        {offer.status === 'pending'
                          ? 'Đang chờ'
                          : offer.status === 'negotiating'
                          ? 'Đang deal'
                          : offer.status === 'accepted'
                          ? 'Đã nhận'
                          : 'Từ chối'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Progress */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Tiến độ đánh giá</h2>
          {offers.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] text-center py-8">
              Thêm offer để xem tiến độ đánh giá
            </p>
          ) : (
            <div className="space-y-4">
              {categoryStats.map((stat) => (
                <div key={stat.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{stat.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">{stat.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[rgba(51,65,85,0.5)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${stat.percentage}%`,
                        background: stat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          className="glass-card p-5 text-left hover:border-[rgba(99,102,241,0.5)] transition-all group"
          onClick={() => setCurrentPage('compare')}
        >
          <GitCompareArrows size={24} className="text-[#818cf8] mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold mb-1">So sánh Offers</h3>
          <p className="text-sm text-[var(--text-secondary)]">So sánh chi tiết giữa các offer</p>
        </button>

        <button
          className="glass-card p-5 text-left hover:border-[rgba(236,72,153,0.5)] transition-all group"
          onClick={() => setCurrentPage('interview')}
        >
          <HelpCircle size={24} className="text-[#ec4899] mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold mb-1">Hướng dẫn phỏng vấn</h3>
          <p className="text-sm text-[var(--text-secondary)]">Các câu hỏi nên hỏi khi PV</p>
        </button>

        <button
          className="glass-card p-5 text-left hover:border-[rgba(6,182,212,0.5)] transition-all group"
          onClick={() => setCurrentPage('assistant')}
        >
          <MessageCircle size={24} className="text-[#06b6d4] mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold mb-1">AI Tư vấn</h3>
          <p className="text-sm text-[var(--text-secondary)]">Nhờ AI phân tích và tư vấn</p>
        </button>
      </div>
    </div>
  );
}

