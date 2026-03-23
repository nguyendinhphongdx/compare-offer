'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
} from 'recharts';
import {
  ArrowRight,
  DollarSign,
  Heart,
  Rocket,
  Trophy,
  Clock,
  Check,
  Minus,
  Shield,
  Palmtree,
  Wifi,
  UtensilsCrossed,
  Car,
  Phone,
  GraduationCap,
  Laptop,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  calcTotalAnnualComp,
  calcEffectiveHourlyRate,
  calcCategoryRatingAvg,
  calcVerdicts,
} from '@/lib/chart-helpers';

export default function ChartsView() {
  const { offers, criteria } = useStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [growthYears, setGrowthYears] = useState(5);
  const [growthRate, setGrowthRate] = useState(15);

  if (offers.length === 0) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Biểu đồ & Phân tích</h1>
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Chưa có dữ liệu</h3>
            <p className="text-muted-foreground mb-4">Thêm offer để xem biểu đồ phân tích</p>
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

  // ─── Data Computations ───
  const verdicts = calcVerdicts(offers, criteria);

  const verdictIcons: Record<string, React.ReactNode> = {
    money: <DollarSign size={20} className="text-chart-3" />,
    wlb: <Heart size={20} className="text-chart-2" />,
    career: <Rocket size={20} className="text-chart-5" />,
    overall: <Trophy size={20} className="text-chart-4" />,
  };
  const verdictColors: Record<string, string> = {
    money: 'bg-chart-3/15',
    wlb: 'bg-chart-2/15',
    career: 'bg-chart-5/15',
    overall: 'bg-chart-4/15',
  };

  // Total annual comp data
  const annualCompData = offers.map((o) => {
    const comp = calcTotalAnnualComp(o);
    return {
      name: o.companyName.length > 14 ? o.companyName.slice(0, 14) + '…' : o.companyName,
      fullName: o.companyName,
      'Lương 12 tháng': comp.base12,
      'Thưởng T13': comp.bonus13,
      'Thưởng hiệu suất': comp.performance,
      'Signing Bonus': comp.signing,
      total: comp.total,
      color: o.color,
    };
  });

  // Hourly rate data
  const hourlyRateData = offers
    .map((o) => {
      const rate = calcEffectiveHourlyRate(o);
      return {
        name: o.companyName.length > 14 ? o.companyName.slice(0, 14) + '…' : o.companyName,
        fullName: o.companyName,
        rate: rate || 0,
        hasData: rate !== null,
        color: o.color,
      };
    })
    .sort((a, b) => b.rate - a.rate);

  const hasHourlyData = hourlyRateData.some((d) => d.hasData);

  // Category radar data (grouped by 4 categories)
  const radarCategories = [
    { key: 'work_culture', label: 'Văn hóa' },
    { key: 'career_growth', label: 'Sự nghiệp' },
    { key: 'work_life_balance', label: 'Work-Life' },
    { key: 'technical', label: 'Kỹ thuật' },
  ];

  const radarData = radarCategories.map((cat) => {
    const point: Record<string, string | number> = { category: cat.label };
    offers.forEach((offer) => {
      point[offer.companyName] = calcCategoryRatingAvg(offer, cat.key, criteria);
    });
    return point;
  });

  const hasRadarData = radarData.some((d) =>
    offers.some((o) => Number(d[o.companyName] || 0) > 0)
  );

  // Benefits comparison
  const benefitItems = [
    { id: 'health_insurance', label: 'Bảo hiểm SK', icon: <Shield size={14} />, type: 'salary' as const },
    { id: 'annual_leave', label: 'Ngày phép', icon: <Palmtree size={14} />, type: 'number' as const },
    { id: 'remote_work', label: 'Remote', icon: <Wifi size={14} />, type: 'text' as const },
    { id: 'lunch_allowance', label: 'Ăn trưa', icon: <UtensilsCrossed size={14} />, type: 'text' as const },
    { id: 'parking', label: 'Gửi xe', icon: <Car size={14} />, type: 'text' as const },
    { id: 'phone_allowance', label: 'Điện thoại', icon: <Phone size={14} />, type: 'text' as const },
    { id: 'training_budget', label: 'Đào tạo', icon: <GraduationCap size={14} />, type: 'text' as const },
    { id: 'equipment', label: 'Thiết bị', icon: <Laptop size={14} />, type: 'text' as const },
  ];

  // Growth projection data
  const growthData = Array.from({ length: growthYears + 1 }, (_, year) => {
    const point: Record<string, string | number> = { year: `Năm ${year}` };
    offers.forEach((offer) => {
      const base = offer.values.find((v) => v.criterionId === 'base_salary');
      const baseSalary = Number(base?.value || 0);
      point[offer.companyName] = Math.round(baseSalary * Math.pow(1 + growthRate / 100, year));
    });
    return point;
  });

  // ─── Chart Styles ───
  const CHART_FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';
  const gridColor = isDark ? '#2e3a50' : '#e2e8f0';
  const axisColor = isDark ? '#7a8599' : '#94a3b8';

  const tooltipStyle = {
    background: isDark ? '#1a2236' : '#ffffff',
    border: `1px solid ${isDark ? '#2e3a50' : '#e2e8f0'}`,
    borderRadius: '8px',
    color: isDark ? '#e8ecf2' : '#1e293b',
    fontFamily: CHART_FONT,
  };

  const axisStyle = { fontFamily: CHART_FONT };

  const formatVND = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  const formatFullVND = (val: number) =>
    new Intl.NumberFormat('vi-VN').format(val) + ' ₫';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Biểu đồ & Phân tích</h1>
        <p className="text-muted-foreground mt-1">Trực quan hóa và so sánh các offer</p>
      </div>

      {/* ─── ROW 0: Verdict Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {verdicts.map((v) => (
          <Card key={v.icon} className={v.winnerId ? 'border-border' : 'opacity-60'}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{v.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${verdictColors[v.icon]}`}>
                  {verdictIcons[v.icon]}
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                {v.winnerId && (
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: v.winnerColor }}
                  >
                    {v.winnerName.charAt(0)}
                  </div>
                )}
                <p className="font-semibold text-sm truncate">{v.winnerName}</p>
              </div>
              <p className="text-lg font-bold">{v.metric}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Dashboard Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Total Annual Compensation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng thu nhập cả năm</CardTitle>
            <CardDescription>Lương 12T + Thưởng T13 + Hiệu suất + Signing</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={50 * offers.length + 80}>
              <BarChart
                data={annualCompData}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={axisColor}
                  fontSize={11}
                  tickFormatter={formatVND}
                  tick={axisStyle}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={axisColor}
                  fontSize={11}
                  tick={axisStyle}
                  width={100}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatFullVND(Number(value ?? 0))}
                  labelFormatter={(label) => {
                    const item = annualCompData.find((d) => d.name === label);
                    return item ? `${item.fullName} — Tổng: ${formatFullVND(item.total)}` : label;
                  }}
                />
                <Legend wrapperStyle={{ ...axisStyle, fontSize: 11 }} />
                <Bar dataKey="Lương 12 tháng" stackId="comp" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Thưởng T13" stackId="comp" fill="#10b981" />
                <Bar dataKey="Thưởng hiệu suất" stackId="comp" fill="#f59e0b" />
                <Bar dataKey="Signing Bonus" stackId="comp" fill="#ec4899" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Widget 2: Effective Hourly Rate */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Lương thực tế / giờ</CardTitle>
                <CardDescription>Lương Net ÷ số giờ làm/tháng</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!hasHourlyData ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Clock size={32} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cần nhập Lương Net + Giờ làm/tuần hoặc Lịch làm việc
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                {hourlyRateData.map((item, idx) => {
                  const maxRate = hourlyRateData[0]?.rate || 1;
                  const pct = maxRate > 0 ? (item.rate / maxRate) * 100 : 0;
                  const isTop = idx === 0 && item.rate > 0;
                  return (
                    <div key={item.fullName} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ background: item.color }}
                          >
                            {item.fullName.charAt(0)}
                          </div>
                          <span className="font-medium truncate max-w-32">{item.fullName}</span>
                          {isTop && hourlyRateData.filter((d) => d.hasData).length >= 2 && (
                            <Badge variant="secondary" className="bg-chart-3/20 text-chart-3 text-[10px] px-1.5">
                              Cao nhất
                            </Badge>
                          )}
                        </div>
                        <span className={`font-bold tabular-nums ${isTop ? 'text-chart-3' : ''}`}>
                          {item.hasData ? formatFullVND(item.rate) + '/h' : 'N/A'}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.hasData ? pct : 0}%`,
                            background: item.color,
                            opacity: isTop ? 1 : 0.6,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground mt-2">
                  * Tính trên Lương Net ÷ (giờ/tuần × 4.33 tuần)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 3: Category Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Đánh giá theo nhóm</CardTitle>
            <CardDescription>Trung bình rating của 4 nhóm tiêu chí</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasRadarData ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">
                  Chưa có đánh giá rating nào
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={gridColor} />
                  <PolarAngleAxis
                    dataKey="category"
                    stroke={axisColor}
                    fontSize={12}
                    tick={axisStyle}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 5]}
                    stroke={axisColor}
                    fontSize={9}
                    tick={axisStyle}
                  />
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
                  <Legend wrapperStyle={{ ...axisStyle, fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Widget 4: Benefits Matrix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">So sánh phúc lợi</CardTitle>
            <CardDescription>Chi tiết phúc lợi từng offer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground text-xs">
                      Phúc lợi
                    </th>
                    {offers.map((o) => (
                      <th key={o.id} className="text-center py-2 px-2 min-w-20">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ background: o.color }}
                          >
                            {o.companyName.charAt(0)}
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate max-w-16">
                            {o.companyName}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {benefitItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{item.icon}</span>
                          {item.label}
                        </div>
                      </td>
                      {offers.map((o) => {
                        const v = o.values.find((v) => v.criterionId === item.id);
                        const val = v?.value;
                        const hasVal = val !== undefined && val !== '' && val !== 0 && val !== false;

                        let display: React.ReactNode;
                        if (!hasVal) {
                          display = <Minus size={14} className="text-muted-foreground/40" />;
                        } else if (item.type === 'salary') {
                          display = (
                            <span className="text-[11px] font-medium">
                              {formatVND(Number(val))}
                            </span>
                          );
                        } else if (item.type === 'number') {
                          display = (
                            <span className="text-[11px] font-medium">{val}</span>
                          );
                        } else {
                          display = <Check size={14} className="text-chart-3" />;
                        }

                        return (
                          <td key={o.id} className="py-2 px-2 text-center">
                            <div className="flex justify-center">{display}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Widget 5: Salary Growth Projection - Full Width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-base">Dự đoán tăng trưởng lương</CardTitle>
                <CardDescription>
                  Ước tính lương Gross theo thời gian
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Số năm:</Label>
                  <Input
                    type="number"
                    className="w-16 h-8 text-center text-sm"
                    value={growthYears}
                    min={1}
                    max={20}
                    onChange={(e) => setGrowthYears(Number(e.target.value) || 5)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Tăng %/năm:</Label>
                  <Input
                    type="number"
                    className="w-16 h-8 text-center text-sm"
                    value={growthRate}
                    min={0}
                    max={100}
                    onChange={(e) => setGrowthRate(Number(e.target.value) || 10)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={growthData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="year" stroke={axisColor} fontSize={11} tick={axisStyle} />
                <YAxis
                  stroke={axisColor}
                  fontSize={11}
                  tickFormatter={formatVND}
                  tick={axisStyle}
                  width={50}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatFullVND(Number(value ?? 0))}
                />
                <Legend wrapperStyle={{ ...axisStyle, fontSize: 12 }} />
                {offers.map((offer) => (
                  <Line
                    key={offer.id}
                    type="monotone"
                    dataKey={offer.companyName}
                    stroke={offer.color}
                    strokeWidth={2}
                    dot={{ fill: offer.color, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              * Dự đoán dựa trên mức tăng lương trung bình {growthRate}%/năm. Thực tế có thể khác.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
