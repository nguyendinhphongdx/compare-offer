'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Offer, Criterion, CriterionCategory } from '@/types';
import { CATEGORY_LABELS } from '@/data/criteria';
import StarRating from './StarRating';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  Building2,
  ChevronDown,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'current', label: 'Công ty hiện tại' },
  { value: 'pending', label: 'Đang chờ' },
  { value: 'negotiating', label: 'Đang deal' },
  { value: 'accepted', label: 'Đã nhận' },
  { value: 'declined', label: 'Từ chối' },
];

export default function OfferManager() {
  const { offers, criteria, addOffer, updateOffer, deleteOffer, updateOfferValue, addCriterion, deleteCriterion } =
    useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['compensation']));
  const [showAddCriterion, setShowAddCriterion] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    status: 'pending' as Offer['status'],
    date: new Date().toISOString().split('T')[0],
    deadline: '',
    notes: '',
  });

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

  const groupedCriteria = Object.entries(CATEGORY_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      items: criteria.filter((c) => c.category === key),
    }))
    .filter((g) => g.items.length > 0);

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
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Offers</h1>
          <p className="text-muted-foreground mt-1">Thêm, chỉnh sửa và đánh giá các offer</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowAddCriterion(!showAddCriterion)}>
            <Plus size={16} /> Thêm tiêu chí
          </Button>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={16} /> Thêm Offer
          </Button>
        </div>
      </div>

      {/* Add Custom Criterion */}
      {showAddCriterion && (
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Thêm tiêu chí tùy chỉnh</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Tên tiêu chí"
                value={newCriterion.name}
                onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
              />
              <Select
                value={newCriterion.category}
                onValueChange={(val) => setNewCriterion({ ...newCriterion, category: val as CriterionCategory })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={newCriterion.type}
                onValueChange={(val) => setNewCriterion({ ...newCriterion, type: val as Criterion['type'] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Văn bản</SelectItem>
                  <SelectItem value="number">Số</SelectItem>
                  <SelectItem value="rating">Đánh giá sao</SelectItem>
                  <SelectItem value="boolean">Có/Không</SelectItem>
                  <SelectItem value="salary">Tiền lương</SelectItem>
                  <SelectItem value="work_schedule">Lịch làm việc</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (newCriterion.name) {
                    addCriterion({ ...newCriterion, description: newCriterion.name });
                    setNewCriterion({ name: '', category: 'custom', description: '', type: 'text' });
                  }
                }}
              >
                <Plus size={16} /> Thêm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offer Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Chỉnh sửa Offer' : 'Thêm Offer mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tên công ty *</Label>
              <Input
                placeholder="VD: Google Vietnam"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Vị trí *</Label>
              <Input
                placeholder="VD: Senior Frontend Developer"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val as Offer['status'] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ngày nhận offer</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hạn trả lời</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                rows={3}
                placeholder="Ghi chú thêm về offer..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                Hủy
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                <Save size={16} /> {editingId ? 'Cập nhật' : 'Thêm Offer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offers List */}
      {offers.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building2 size={36} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Chưa có offer nào</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Thêm các offer bạn đã nhận để bắt đầu so sánh và phân tích.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} /> Thêm offer đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card key={offer.id}>
              {/* Offer Header */}
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-accent/30 transition-colors rounded-t-lg"
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
                          ? 'bg-chart-5/20 text-chart-5'
                          : offer.status === 'accepted'
                          ? 'bg-chart-3/20 text-chart-3'
                          : offer.status === 'negotiating'
                          ? 'bg-chart-4/20 text-chart-4'
                          : ''
                      }
                    >
                      {STATUS_OPTIONS.find((s) => s.value === offer.status)?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{offer.position}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); handleEdit(offer); }}
                  >
                    <Edit3 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteOffer(offer.id); }}
                  >
                    <Trash2 size={16} />
                  </Button>
                  {expandedOffer === offer.id ? (
                    <ChevronDown size={18} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={18} className="text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Criteria */}
              {expandedOffer === offer.id && (
                <CardContent className="border-t border-border pt-5 animate-fade-in">
                  <div className="space-y-4">
                    {groupedCriteria.map((group) => (
                      <Collapsible
                        key={group.key}
                        open={expandedCategories.has(group.key)}
                        onOpenChange={() => toggleCategory(group.key)}
                      >
                        <div className="flex items-center gap-2">
                          <CollapsibleTrigger className="inline-flex items-center gap-2 text-primary font-semibold text-sm px-2 h-8 rounded-md hover:bg-accent/50 transition-colors">
                            {expandedCategories.has(group.key) ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                            {group.label}
                            <span className="text-xs text-muted-foreground font-normal">
                              ({group.items.length})
                            </span>
                          </CollapsibleTrigger>
                          {group.key === 'compensation' && (
                            <a
                              href="https://candidate.talent.vn/salary-calculator"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-accent/50"
                            >
                              <ExternalLink size={12} />
                              Tính Gross ⇄ Net
                            </a>
                          )}
                        </div>
                        <CollapsibleContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-5 mt-2">
                            {group.items.map((criterion) => {
                              const currentValue = offer.values.find(
                                (v) => v.criterionId === criterion.id
                              );
                              return (
                                <div key={criterion.id} className="space-y-1.5">
                                  <div className="flex items-center gap-1">
                                    <Label className="text-sm text-muted-foreground">
                                      {criterion.name}
                                    </Label>
                                    {criterion.isCustom && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteCriterion(criterion.id)}
                                      >
                                        <X size={10} />
                                      </Button>
                                    )}
                                  </div>
                                  {criterion.type === 'rating' ? (
                                    <StarRating
                                      value={Number(currentValue?.value || 0)}
                                      onChange={(v) =>
                                        updateOfferValue(offer.id, criterion.id, v, currentValue?.note)
                                      }
                                    />
                                  ) : criterion.type === 'boolean' ? (
                                    <div className="flex gap-2">
                                      <Button
                                        variant={currentValue?.value === true ? 'default' : 'outline'}
                                        size="sm"
                                        className={
                                          currentValue?.value === true
                                            ? 'bg-chart-3/20 text-chart-3 hover:bg-chart-3/30 border-chart-3/30'
                                            : ''
                                        }
                                        onClick={() =>
                                          updateOfferValue(offer.id, criterion.id, true, currentValue?.note)
                                        }
                                      >
                                        Có
                                      </Button>
                                      <Button
                                        variant={currentValue?.value === false ? 'default' : 'outline'}
                                        size="sm"
                                        className={
                                          currentValue?.value === false
                                            ? 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30'
                                            : ''
                                        }
                                        onClick={() =>
                                          updateOfferValue(offer.id, criterion.id, false, currentValue?.note)
                                        }
                                      >
                                        Không
                                      </Button>
                                    </div>
                                  ) : criterion.type === 'work_schedule' ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {[
                                        { value: 'mon_fri', label: 'T2 - T6', icon: '🟢' },
                                        { value: 'mon_sat_half', label: 'T2 - Sáng T7', icon: '🟡' },
                                        { value: 'mon_sat', label: 'T2 - T7', icon: '🔴' },
                                        { value: 'shift', label: 'Ca kíp', icon: '🔵' },
                                        { value: 'other', label: 'Khác', icon: '⚪' },
                                      ].map((opt) => (
                                        <Button
                                          key={opt.value}
                                          variant={currentValue?.value === opt.value ? 'default' : 'outline'}
                                          size="sm"
                                          className={
                                            currentValue?.value === opt.value
                                              ? opt.value === 'mon_fri'
                                                ? 'bg-chart-3/20 text-chart-3 hover:bg-chart-3/30 border-chart-3/30'
                                                : opt.value === 'mon_sat_half'
                                                ? 'bg-chart-4/20 text-chart-4 hover:bg-chart-4/30 border-chart-4/30'
                                                : opt.value === 'mon_sat'
                                                ? 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30'
                                                : 'bg-chart-5/20 text-chart-5 hover:bg-chart-5/30 border-chart-5/30'
                                              : ''
                                          }
                                          onClick={() =>
                                            updateOfferValue(offer.id, criterion.id, opt.value, currentValue?.note)
                                          }
                                        >
                                          {opt.icon} {opt.label}
                                        </Button>
                                      ))}
                                    </div>
                                  ) : criterion.type === 'salary' || criterion.type === 'number' ? (
                                    <Input
                                      placeholder={
                                        criterion.type === 'salary' ? 'VD: 30000000' : 'Nhập số...'
                                      }
                                      value={
                                        criterion.type === 'salary'
                                          ? formatSalary(currentValue?.value || 0)
                                          : (currentValue?.value as string) || ''
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        updateOfferValue(
                                          offer.id,
                                          criterion.id,
                                          Number(raw) || 0,
                                          currentValue?.note
                                        );
                                      }}
                                    />
                                  ) : (
                                    <Input
                                      placeholder={criterion.description}
                                      value={(currentValue?.value as string) || ''}
                                      onChange={(e) =>
                                        updateOfferValue(offer.id, criterion.id, e.target.value, currentValue?.note)
                                      }
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {group.key === 'compensation' && (
                            <div className="ml-5 mt-3">
                              <Label className="text-sm text-muted-foreground">Ghi chú thêm về lương thưởng</Label>
                              <Textarea
                                rows={2}
                                placeholder="VD: Lương review 2 lần/năm, thưởng KPI theo quý..."
                                className="mt-1 text-sm"
                                value={
                                  (offer.values.find((v) => v.criterionId === '_compensation_note')?.value as string) || ''
                                }
                                onChange={(e) =>
                                  updateOfferValue(offer.id, '_compensation_note', e.target.value)
                                }
                              />
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
