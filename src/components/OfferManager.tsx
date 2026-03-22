'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Offer, Criterion, CriterionCategory } from '@/types';
import { CATEGORY_LABELS } from '@/data/criteria';
import StarRating from './StarRating';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  Building2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Đang chờ', color: '#818cf8' },
  { value: 'negotiating', label: 'Đang deal', color: '#f59e0b' },
  { value: 'accepted', label: 'Đã nhận', color: '#10b981' },
  { value: 'declined', label: 'Từ chối', color: '#ef4444' },
];

export default function OfferManager() {
  const { offers, criteria, addOffer, updateOffer, deleteOffer, updateOfferValue, addCriterion, deleteCriterion } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['compensation']));
  const [showAddCriterion, setShowAddCriterion] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    status: 'pending' as Offer['status'],
    date: new Date().toISOString().split('T')[0],
    deadline: '',
    notes: '',
  });

  // Custom criterion form
  const [newCriterion, setNewCriterion] = useState({
    name: '',
    category: 'custom' as CriterionCategory,
    description: '',
    type: 'text' as Criterion['type'],
  });

  const resetForm = () => {
    setFormData({
      companyName: '',
      position: '',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      deadline: '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!formData.companyName || !formData.position) return;
    if (editingId) {
      updateOffer(editingId, formData);
    } else {
      addOffer({ ...formData, values: [], overallRating: 0 });
    }
    resetForm();
  };

  const handleEdit = (offer: Offer) => {
    setFormData({
      companyName: offer.companyName,
      position: offer.position,
      status: offer.status,
      date: offer.date,
      deadline: offer.deadline || '',
      notes: offer.notes || '',
    });
    setEditingId(offer.id);
    setShowForm(true);
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  const groupedCriteria = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    items: criteria.filter((c) => c.category === key),
  })).filter(g => g.items.length > 0);

  const formatSalary = (val: string | number | boolean) => {
    const num = Number(val);
    if (isNaN(num) || num === 0) return '';
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Offers</h1>
          <p className="text-[var(--text-secondary)] mt-1">Thêm, chỉnh sửa và đánh giá các offer</p>
        </div>
        <div className="flex gap-3">
          <button
            className="btn-secondary"
            onClick={() => setShowAddCriterion(!showAddCriterion)}
          >
            <Plus size={16} /> Thêm tiêu chí
          </button>
          <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={16} /> Thêm Offer
          </button>
        </div>
      </div>

      {/* Add Custom Criterion */}
      {showAddCriterion && (
        <div className="glass-card p-5 animate-fade-in">
          <h3 className="font-semibold mb-3">Thêm tiêu chí tùy chỉnh</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="input-field"
              placeholder="Tên tiêu chí"
              value={newCriterion.name}
              onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
            />
            <select
              className="input-field"
              value={newCriterion.category}
              onChange={(e) => setNewCriterion({ ...newCriterion, category: e.target.value as CriterionCategory })}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={newCriterion.type}
              onChange={(e) => setNewCriterion({ ...newCriterion, type: e.target.value as Criterion['type'] })}
            >
              <option value="text">Văn bản</option>
              <option value="number">Số</option>
              <option value="rating">Đánh giá sao</option>
              <option value="boolean">Có/Không</option>
              <option value="salary">Tiền lương</option>
            </select>
            <button
              className="btn-primary"
              onClick={() => {
                if (newCriterion.name) {
                  addCriterion({ ...newCriterion, description: newCriterion.name });
                  setNewCriterion({ name: '', category: 'custom', description: '', type: 'text' });
                }
              }}
            >
              <Plus size={16} /> Thêm
            </button>
          </div>
        </div>
      )}

      {/* Offer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-fade-in" style={{ background: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editingId ? 'Chỉnh sửa Offer' : 'Thêm Offer mới'}</h2>
              <button onClick={resetForm} className="text-[var(--text-muted)] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-1 block">Tên công ty *</label>
                <input
                  className="input-field"
                  placeholder="VD: Google Vietnam"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-1 block">Vị trí *</label>
                <input
                  className="input-field"
                  placeholder="VD: Senior Frontend Developer"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">Trạng thái</label>
                  <select
                    className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Offer['status'] })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">Ngày nhận offer</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-1 block">Hạn trả lời</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-1 block">Ghi chú</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Ghi chú thêm về offer..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn-secondary flex-1" onClick={resetForm}>Hủy</button>
                <button className="btn-primary flex-1" onClick={handleSubmit}>
                  <Save size={16} /> {editingId ? 'Cập nhật' : 'Thêm Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offers List */}
      {offers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[rgba(99,102,241,0.1)] flex items-center justify-center mx-auto mb-4">
            <Building2 size={36} className="text-[#818cf8]" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Chưa có offer nào</h3>
          <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
            Thêm các offer bạn đã nhận để bắt đầu so sánh và phân tích. Bạn có thể đánh giá từng tiêu chí cho mỗi offer.
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Thêm offer đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div key={offer.id} className="glass-card overflow-hidden">
              {/* Offer Header */}
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-[rgba(51,65,85,0.3)] transition-all"
                onClick={() => setExpandedOffer(expandedOffer === offer.id ? null : offer.id)}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg"
                  style={{ background: offer.color }}
                >
                  {offer.companyName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{offer.companyName}</h3>
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
                      {STATUS_OPTIONS.find((s) => s.value === offer.status)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{offer.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-lg hover:bg-[rgba(99,102,241,0.15)] text-[var(--text-muted)] hover:text-[#818cf8] transition-all"
                    onClick={(e) => { e.stopPropagation(); handleEdit(offer); }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-[rgba(239,68,68,0.15)] text-[var(--text-muted)] hover:text-[#ef4444] transition-all"
                    onClick={(e) => { e.stopPropagation(); deleteOffer(offer.id); }}
                  >
                    <Trash2 size={16} />
                  </button>
                  {expandedOffer === offer.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {/* Expanded Criteria */}
              {expandedOffer === offer.id && (
                <div className="border-t border-[var(--border-color)] p-5 animate-fade-in">
                  <div className="space-y-4">
                    {groupedCriteria.map((group) => (
                      <div key={group.key}>
                        <button
                          className="flex items-center gap-2 mb-3 text-sm font-semibold"
                          style={{ color: CATEGORY_LABELS[group.key] ? '#818cf8' : 'var(--text-secondary)' }}
                          onClick={() => toggleCategory(group.key)}
                        >
                          {expandedCategories.has(group.key) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {group.label}
                          <span className="text-xs text-[var(--text-muted)] font-normal">({group.items.length})</span>
                        </button>

                        {expandedCategories.has(group.key) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-5">
                            {group.items.map((criterion) => {
                              const currentValue = offer.values.find((v) => v.criterionId === criterion.id);
                              return (
                                <div key={criterion.id} className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm text-[var(--text-secondary)]">
                                      {criterion.name}
                                      {criterion.isCustom && (
                                        <button
                                          className="ml-2 text-[var(--text-muted)] hover:text-[#ef4444]"
                                          onClick={() => deleteCriterion(criterion.id)}
                                        >
                                          <X size={12} />
                                        </button>
                                      )}
                                    </label>
                                  </div>
                                  {criterion.type === 'rating' ? (
                                    <StarRating
                                      value={Number(currentValue?.value || 0)}
                                      onChange={(v) => updateOfferValue(offer.id, criterion.id, v)}
                                    />
                                  ) : criterion.type === 'boolean' ? (
                                    <div className="flex gap-2">
                                      <button
                                        className={`px-3 py-1 rounded-md text-sm transition-all ${
                                          currentValue?.value === true
                                            ? 'bg-[rgba(16,185,129,0.2)] text-[#10b981] border border-[rgba(16,185,129,0.3)]'
                                            : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-color)]'
                                        }`}
                                        onClick={() => updateOfferValue(offer.id, criterion.id, true)}
                                      >
                                        Có
                                      </button>
                                      <button
                                        className={`px-3 py-1 rounded-md text-sm transition-all ${
                                          currentValue?.value === false
                                            ? 'bg-[rgba(239,68,68,0.2)] text-[#ef4444] border border-[rgba(239,68,68,0.3)]'
                                            : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-color)]'
                                        }`}
                                        onClick={() => updateOfferValue(offer.id, criterion.id, false)}
                                      >
                                        Không
                                      </button>
                                    </div>
                                  ) : criterion.type === 'salary' || criterion.type === 'number' ? (
                                    <input
                                      type="text"
                                      className="input-field text-sm"
                                      placeholder={criterion.type === 'salary' ? 'VD: 30000000' : 'Nhập số...'}
                                      value={
                                        criterion.type === 'salary'
                                          ? formatSalary(currentValue?.value || 0)
                                          : (currentValue?.value as string) || ''
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        updateOfferValue(offer.id, criterion.id, Number(raw) || 0);
                                      }}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      className="input-field text-sm"
                                      placeholder={criterion.description}
                                      value={(currentValue?.value as string) || ''}
                                      onChange={(e) => updateOfferValue(offer.id, criterion.id, e.target.value)}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
