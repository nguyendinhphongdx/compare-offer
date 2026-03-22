'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowRight } from 'lucide-react';

type ChartType = 'salary' | 'radar' | 'growth' | 'benefits';

export default function ChartsView() {
  const { offers, criteria, setCurrentPage } = useStore();
  const [activeChart, setActiveChart] = useState<ChartType>('salary');
  const [growthYears, setGrowthYears] = useState(5);
  const [growthRate, setGrowthRate] = useState(15);

  if (offers.length === 0) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-2">Biểu đồ & Phân tích</h1>
        <div className="glass-card p-12 text-center mt-6">
          <h3 className="text-lg font-semibold mb-2">Chưa có dữ liệu</h3>
          <p className="text-[var(--text-secondary)] mb-4">Thêm offer để xem biểu đồ phân tích</p>
          <button className="btn-primary" onClick={() => setCurrentPage('offers')}>
            Thêm Offer <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Salary comparison data
  const salaryData = offers.map((o) => {
    const base = o.values.find((v) => v.criterionId === 'base_salary');
    const net = o.values.find((v) => v.criterionId === 'net_salary');
    const signing = o.values.find((v) => v.criterionId === 'signing_bonus');
    return {
      name: o.companyName.length > 12 ? o.companyName.slice(0, 12) + '...' : o.companyName,
      'Lương Gross': Number(base?.value || 0),
      'Lương Net': Number(net?.value || 0),
      'Signing Bonus': Number(signing?.value || 0),
      color: o.color,
    };
  });

  // Radar data - rating categories
  const ratingCriteria = criteria.filter((c) => c.type === 'rating');
  const radarData = ratingCriteria.map((criterion) => {
    const dataPoint: Record<string, string | number> = { criterion: criterion.name };
    offers.forEach((offer) => {
      const val = offer.values.find((v) => v.criterionId === criterion.id);
      dataPoint[offer.companyName] = Number(val?.value || 0);
    });
    return dataPoint;
  });

  // Growth projection data
  const growthData = Array.from({ length: growthYears + 1 }, (_, year) => {
    const dataPoint: Record<string, string | number> = { year: `Năm ${year}` };
    offers.forEach((offer) => {
      const base = offer.values.find((v) => v.criterionId === 'base_salary');
      const baseSalary = Number(base?.value || 0);
      dataPoint[offer.companyName] = Math.round(baseSalary * Math.pow(1 + growthRate / 100, year));
    });
    return dataPoint;
  });

  // Benefits pie data
  const benefitsCriteria = criteria.filter((c) => c.category === 'benefits');
  const benefitsData = offers.map((o) => {
    const filledBenefits = benefitsCriteria.filter((c) => {
      const v = o.values.find((v) => v.criterionId === c.id);
      return v && v.value !== '' && v.value !== 0 && v.value !== false;
    });
    return {
      name: o.companyName,
      value: filledBenefits.length,
      total: benefitsCriteria.length,
      color: o.color,
    };
  });

  const formatVND = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  const chartTabs: { id: ChartType; label: string }[] = [
    { id: 'salary', label: 'So sánh lương' },
    { id: 'radar', label: 'Đánh giá tổng hợp' },
    { id: 'growth', label: 'Dự đoán tăng trưởng' },
    { id: 'benefits', label: 'Phúc lợi' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Biểu đồ & Phân tích</h1>
        <p className="text-[var(--text-secondary)] mt-1">Trực quan hóa và so sánh các offer</p>
      </div>

      {/* Chart Tabs */}
      <div className="flex gap-2 flex-wrap">
        {chartTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeChart === tab.id
                ? 'bg-[rgba(99,102,241,0.2)] text-[#818cf8] border border-[rgba(99,102,241,0.3)]'
                : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[rgba(99,102,241,0.3)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="glass-card p-6">
        {activeChart === 'salary' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">So sánh mức lương</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salaryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatVND} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value) => new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + ' ₫'}
                />
                <Legend />
                <Bar dataKey="Lương Gross" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lương Net" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Signing Bonus" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeChart === 'radar' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Đánh giá tổng hợp (Rating)</h3>
            {radarData.length === 0 ? (
              <p className="text-center text-[var(--text-secondary)] py-12">
                Chưa có đánh giá rating nào. Hãy đánh giá các tiêu chí trong phần Quản lý Offers.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={450}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(51,65,85,0.5)" />
                  <PolarAngleAxis dataKey="criterion" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#64748b" fontSize={10} />
                  {offers.map((offer) => (
                    <Radar
                      key={offer.id}
                      name={offer.companyName}
                      dataKey={offer.companyName}
                      stroke={offer.color}
                      fill={offer.color}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {activeChart === 'growth' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Dự đoán tăng trưởng lương</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[var(--text-secondary)]">Số năm:</label>
                  <input
                    type="number"
                    className="input-field w-16 text-center"
                    value={growthYears}
                    min={1}
                    max={20}
                    onChange={(e) => setGrowthYears(Number(e.target.value) || 5)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[var(--text-secondary)]">Tăng %/năm:</label>
                  <input
                    type="number"
                    className="input-field w-16 text-center"
                    value={growthRate}
                    min={0}
                    max={100}
                    onChange={(e) => setGrowthRate(Number(e.target.value) || 10)}
                  />
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatVND} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value) => new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + ' ₫'}
                />
                <Legend />
                {offers.map((offer) => (
                  <Line
                    key={offer.id}
                    type="monotone"
                    dataKey={offer.companyName}
                    stroke={offer.color}
                    strokeWidth={2}
                    dot={{ fill: offer.color, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
              * Dự đoán dựa trên mức tăng lương trung bình {growthRate}%/năm. Thực tế có thể khác.
            </p>
          </div>
        )}

        {activeChart === 'benefits' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">So sánh phúc lợi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefitsData.map((item) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Có', value: item.value },
                            { name: 'Chưa', value: item.total - item.value },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                        >
                          <Cell fill={item.color} />
                          <Cell fill="rgba(51,65,85,0.5)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {item.value}/{item.total} phúc lợi đã ghi nhận
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {Math.round((item.value / item.total) * 100)}% hoàn thành
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
