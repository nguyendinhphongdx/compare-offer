'use client';

import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/data/criteria';
import StarRating from './StarRating';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function CompareView() {
  const { offers, criteria, selectedOfferIds, toggleOfferSelection, selectAllOffers, clearSelection, setCurrentPage } = useStore();

  const selectedOffers = offers.filter((o) => selectedOfferIds.includes(o.id));

  const groupedCriteria = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    color: CATEGORY_COLORS[key],
    items: criteria.filter((c) => c.category === key),
  })).filter(g => g.items.length > 0);

  const formatValue = (val: string | number | boolean | undefined, type: string) => {
    if (val === undefined || val === '' || val === 0) return '—';
    if (type === 'salary') {
      const num = Number(val);
      if (isNaN(num)) return String(val);
      return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
    }
    if (type === 'boolean') return val ? 'Có' : 'Không';
    return String(val);
  };

  const getSalaryComparison = (criterionId: string) => {
    const values = selectedOffers.map((o) => {
      const v = o.values.find((v) => v.criterionId === criterionId);
      return { offerId: o.id, value: Number(v?.value || 0) };
    }).filter((v) => v.value > 0);

    if (values.length < 2) return null;
    const max = Math.max(...values.map((v) => v.value));
    return values.reduce((acc, v) => {
      acc[v.offerId] = v.value === max ? 'highest' : 'lower';
      return acc;
    }, {} as Record<string, string>);
  };

  if (offers.length < 2) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">So sánh Offers</h1>
        <div className="glass-card p-12 text-center mt-6">
          <h3 className="text-lg font-semibold mb-2">Cần ít nhất 2 offers để so sánh</h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Bạn hiện có {offers.length} offer. Hãy thêm offer để bắt đầu so sánh.
          </p>
          <button className="btn-primary" onClick={() => setCurrentPage('offers')}>
            Thêm Offer <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">So sánh Offers</h1>
        <p className="text-[var(--text-secondary)] mt-1">Chọn các offer để so sánh chi tiết</p>
      </div>

      {/* Offer Selection */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Chọn offers để so sánh</h3>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm py-1.5 px-3" onClick={selectAllOffers}>Chọn tất cả</button>
            <button className="btn-secondary text-sm py-1.5 px-3" onClick={clearSelection}>Bỏ chọn</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {offers.map((offer) => {
            const isSelected = selectedOfferIds.includes(offer.id);
            return (
              <button
                key={offer.id}
                onClick={() => toggleOfferSelection(offer.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.1)]'
                    : 'border-[var(--border-color)] hover:border-[rgba(99,102,241,0.3)]'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: offer.color }}
                >
                  {offer.companyName.charAt(0)}
                </div>
                <span className="text-sm font-medium">{offer.companyName}</span>
                {isSelected && <CheckCircle2 size={14} className="text-[#818cf8]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedOffers.length >= 2 && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left p-4 text-sm font-semibold text-[var(--text-secondary)] min-w-[200px] sticky left-0 bg-[var(--bg-secondary)] z-10">
                    Tiêu chí
                  </th>
                  {selectedOffers.map((offer) => (
                    <th key={offer.id} className="p-4 text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                          style={{ background: offer.color }}
                        >
                          {offer.companyName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{offer.companyName}</p>
                          <p className="text-xs text-[var(--text-muted)]">{offer.position}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedCriteria.map((group) => (
                  <>
                    {/* Category Header */}
                    <tr key={group.key}>
                      <td
                        colSpan={selectedOffers.length + 1}
                        className="px-4 py-3 text-sm font-semibold"
                        style={{ color: group.color, background: 'rgba(15, 23, 42, 0.5)' }}
                      >
                        {group.label}
                      </td>
                    </tr>
                    {/* Criteria Rows */}
                    {group.items.map((criterion) => {
                      const salaryComp = (criterion.type === 'salary' || criterion.type === 'number')
                        ? getSalaryComparison(criterion.id)
                        : null;

                      return (
                        <tr
                          key={criterion.id}
                          className="border-b border-[rgba(51,65,85,0.3)] hover:bg-[rgba(51,65,85,0.2)] transition-colors"
                        >
                          <td className="p-4 text-sm sticky left-0 bg-[var(--bg-secondary)] z-10">
                            <span className="font-medium">{criterion.name}</span>
                          </td>
                          {selectedOffers.map((offer) => {
                            const val = offer.values.find((v) => v.criterionId === criterion.id);
                            const isHighest = salaryComp?.[offer.id] === 'highest';

                            return (
                              <td key={offer.id} className="p-4 text-center text-sm">
                                {criterion.type === 'rating' ? (
                                  <div className="flex justify-center">
                                    <StarRating value={Number(val?.value || 0)} readonly size={14} />
                                  </div>
                                ) : criterion.type === 'boolean' ? (
                                  <span className="flex justify-center">
                                    {val?.value === true ? (
                                      <CheckCircle2 size={18} className="text-[#10b981]" />
                                    ) : val?.value === false ? (
                                      <XCircle size={18} className="text-[#ef4444]" />
                                    ) : (
                                      <span className="text-[var(--text-muted)]">—</span>
                                    )}
                                  </span>
                                ) : (
                                  <span
                                    className={`${
                                      isHighest
                                        ? 'text-[#10b981] font-semibold'
                                        : ''
                                    }`}
                                  >
                                    {formatValue(val?.value, criterion.type)}
                                    {isHighest && ' ✓'}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOffers.length < 2 && selectedOffers.length > 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-[var(--text-secondary)]">Chọn thêm ít nhất 1 offer nữa để so sánh</p>
        </div>
      )}
    </div>
  );
}
