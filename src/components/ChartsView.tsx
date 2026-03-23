'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useTheme } from 'next-themes';

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

  const ratingCriteria = criteria.filter((c) => c.type === 'rating');
  const radarData = ratingCriteria.map((criterion) => {
    const dataPoint: Record<string, string | number> = { criterion: criterion.name };
    offers.forEach((offer) => {
      const val = offer.values.find((v) => v.criterionId === criterion.id);
      dataPoint[offer.companyName] = Number(val?.value || 0);
    });
    return dataPoint;
  });

  const growthData = Array.from({ length: growthYears + 1 }, (_, year) => {
    const dataPoint: Record<string, string | number> = { year: `Năm ${year}` };
    offers.forEach((offer) => {
      const base = offer.values.find((v) => v.criterionId === 'base_salary');
      const baseSalary = Number(base?.value || 0);
      dataPoint[offer.companyName] = Math.round(
        baseSalary * Math.pow(1 + growthRate / 100, year)
      );
    });
    return dataPoint;
  });

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

  const CHART_FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';
  const gridColor = isDark ? '#2e3a50' : '#e2e8f0';
  const axisColor = isDark ? '#7a8599' : '#94a3b8';
  const emptyPieColor = isDark ? '#2e3a50' : '#e2e8f0';

  const tooltipStyle = {
    background: isDark ? '#1a2236' : '#ffffff',
    border: `1px solid ${isDark ? '#2e3a50' : '#e2e8f0'}`,
    borderRadius: '8px',
    color: isDark ? '#e8ecf2' : '#1e293b',
    fontFamily: CHART_FONT,
  };

  const axisStyle = { fontFamily: CHART_FONT };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Biểu đồ & Phân tích</h1>
        <p className="text-muted-foreground mt-1">Trực quan hóa và so sánh các offer</p>
      </div>

      <Tabs defaultValue="salary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="salary">So sánh lương</TabsTrigger>
          <TabsTrigger value="radar">Đánh giá tổng hợp</TabsTrigger>
          <TabsTrigger value="growth">Dự đoán tăng trưởng</TabsTrigger>
          <TabsTrigger value="benefits">Phúc lợi</TabsTrigger>
        </TabsList>

        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle>So sánh mức lương</CardTitle>
              <CardDescription>Lương Gross, Net và Signing Bonus của từng offer</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salaryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" stroke={axisColor} fontSize={12} tick={axisStyle} />
                  <YAxis
                    stroke={axisColor}
                    fontSize={12}
                    tickFormatter={formatVND}
                    tick={axisStyle}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) =>
                      new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + ' ₫'
                    }
                  />
                  <Legend wrapperStyle={axisStyle} />
                  <Bar dataKey="Lương Gross" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Lương Net" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Signing Bonus" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radar">
          <Card>
            <CardHeader>
              <CardTitle>Đánh giá tổng hợp (Rating)</CardTitle>
              <CardDescription>So sánh đánh giá sao giữa các offer</CardDescription>
            </CardHeader>
            <CardContent>
              {radarData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  Chưa có đánh giá rating nào. Hãy đánh giá các tiêu chí trong Quản lý Offers.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={450}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={gridColor} />
                    <PolarAngleAxis
                      dataKey="criterion"
                      stroke={axisColor}
                      fontSize={11}
                      tick={axisStyle}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 5]}
                      stroke={axisColor}
                      fontSize={10}
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
                    <Legend wrapperStyle={axisStyle} />
                    <Tooltip contentStyle={tooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Dự đoán tăng trưởng lương</CardTitle>
                  <CardDescription>
                    Ước tính lương theo thời gian với mức tăng cố định
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Số năm:</Label>
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={growthYears}
                      min={1}
                      max={20}
                      onChange={(e) => setGrowthYears(Number(e.target.value) || 5)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Tăng %/năm:</Label>
                    <Input
                      type="number"
                      className="w-16 text-center"
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
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={growthData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="year" stroke={axisColor} fontSize={12} tick={axisStyle} />
                  <YAxis
                    stroke={axisColor}
                    fontSize={12}
                    tickFormatter={formatVND}
                    tick={axisStyle}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) =>
                      new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + ' ₫'
                    }
                  />
                  <Legend wrapperStyle={axisStyle} />
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
              <p className="text-xs text-muted-foreground mt-2 text-center">
                * Dự đoán dựa trên mức tăng lương trung bình {growthRate}%/năm. Thực tế có thể
                khác.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>So sánh phúc lợi</CardTitle>
              <CardDescription>Mức độ phúc lợi đã ghi nhận cho mỗi offer</CardDescription>
            </CardHeader>
            <CardContent>
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
                            <Cell fill={emptyPieColor} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.value}/{item.total} phúc lợi đã ghi nhận
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.total > 0
                          ? Math.round((item.value / item.total) * 100)
                          : 0}
                        % hoàn thành
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
