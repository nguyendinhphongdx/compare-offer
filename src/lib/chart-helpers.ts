import { Offer, Criterion } from '@/types';

export interface AnnualComp {
  base12: number;
  bonus13: number;
  performance: number;
  signing: number;
  total: number;
}

export function calcTotalAnnualComp(offer: Offer): AnnualComp {
  const getVal = (id: string) => {
    const v = offer.values.find((v) => v.criterionId === id);
    return Number(v?.value || 0);
  };
  const getBool = (id: string) => {
    return offer.values.find((v) => v.criterionId === id)?.value === true;
  };

  const base = getVal('base_salary');
  const base12 = base * 12;
  const bonus13 = getBool('bonus_13th') ? base : 0;
  const performance = getVal('performance_bonus');
  const signing = getVal('signing_bonus');

  return {
    base12,
    bonus13,
    performance,
    signing,
    total: base12 + bonus13 + performance + signing,
  };
}

export function calcEffectiveHourlyRate(offer: Offer): number | null {
  const getVal = (id: string) => {
    const v = offer.values.find((v) => v.criterionId === id);
    return v?.value;
  };

  const netSalary = Number(getVal('net_salary') || 0);
  if (netSalary <= 0) return null;

  let hoursPerWeek = Number(getVal('total_hours_week') || 0);

  if (hoursPerWeek <= 0) {
    const schedule = getVal('work_schedule');
    const scheduleHoursMap: Record<string, number> = {
      mon_fri: 40,
      mon_sat_half: 44,
      mon_sat: 48,
      shift: 42,
    };
    hoursPerWeek = schedule ? scheduleHoursMap[String(schedule)] || 0 : 0;
  }

  if (hoursPerWeek <= 0) return null;

  return Math.round(netSalary / (hoursPerWeek * 4.33));
}

export function calcCategoryRatingAvg(
  offer: Offer,
  category: string,
  criteria: Criterion[]
): number {
  const ratingCriteria = criteria.filter(
    (c) => c.category === category && c.type === 'rating'
  );
  if (ratingCriteria.length === 0) return 0;

  const sum = ratingCriteria.reduce((acc, c) => {
    const v = offer.values.find((v) => v.criterionId === c.id);
    return acc + Number(v?.value || 0);
  }, 0);

  const filled = ratingCriteria.filter((c) => {
    const v = offer.values.find((v) => v.criterionId === c.id);
    return Number(v?.value || 0) > 0;
  }).length;

  return filled > 0 ? Math.round((sum / filled) * 10) / 10 : 0;
}

export interface VerdictResult {
  label: string;
  winnerId: string | null;
  winnerName: string;
  winnerColor: string;
  metric: string;
  icon: 'money' | 'wlb' | 'career' | 'overall';
}

export function calcVerdicts(offers: Offer[], criteria: Criterion[]): VerdictResult[] {
  if (offers.length === 0) return [];

  // Best Total Comp
  const compData = offers.map((o) => ({
    offer: o,
    total: calcTotalAnnualComp(o).total,
  }));
  const bestComp = compData.reduce((a, b) => (b.total > a.total ? b : a));

  // Best WLB
  const wlbData = offers.map((o) => ({
    offer: o,
    score: calcCategoryRatingAvg(o, 'work_life_balance', criteria),
  }));
  const bestWlb = wlbData.reduce((a, b) => (b.score > a.score ? b : a));

  // Best Career
  const careerData = offers.map((o) => ({
    offer: o,
    score: calcCategoryRatingAvg(o, 'career_growth', criteria),
  }));
  const bestCareer = careerData.reduce((a, b) => (b.score > a.score ? b : a));

  // Best Overall (weighted: 40% comp, 20% wlb, 20% career, 10% culture, 10% technical)
  const overallData = offers.map((o) => {
    const comp = calcTotalAnnualComp(o).total;
    const maxComp = Math.max(...compData.map((c) => c.total), 1);
    const compNorm = (comp / maxComp) * 5;

    const wlb = calcCategoryRatingAvg(o, 'work_life_balance', criteria);
    const career = calcCategoryRatingAvg(o, 'career_growth', criteria);
    const culture = calcCategoryRatingAvg(o, 'work_culture', criteria);
    const tech = calcCategoryRatingAvg(o, 'technical', criteria);

    const score = compNorm * 0.4 + wlb * 0.2 + career * 0.2 + culture * 0.1 + tech * 0.1;
    return { offer: o, score };
  });
  const bestOverall = overallData.reduce((a, b) => (b.score > a.score ? b : a));

  const formatM = (n: number) => {
    if (n <= 0) return 'N/A';
    return (n / 1_000_000).toFixed(0) + 'M/năm';
  };

  return [
    {
      label: 'Thu nhập tốt nhất',
      winnerId: bestComp.total > 0 ? bestComp.offer.id : null,
      winnerName: bestComp.total > 0 ? bestComp.offer.companyName : 'Chưa có dữ liệu',
      winnerColor: bestComp.offer.color,
      metric: formatM(bestComp.total),
      icon: 'money',
    },
    {
      label: 'Work-Life Balance',
      winnerId: bestWlb.score > 0 ? bestWlb.offer.id : null,
      winnerName: bestWlb.score > 0 ? bestWlb.offer.companyName : 'Chưa đánh giá',
      winnerColor: bestWlb.offer.color,
      metric: bestWlb.score > 0 ? `${bestWlb.score}/5 ⭐` : 'N/A',
      icon: 'wlb',
    },
    {
      label: 'Phát triển sự nghiệp',
      winnerId: bestCareer.score > 0 ? bestCareer.offer.id : null,
      winnerName: bestCareer.score > 0 ? bestCareer.offer.companyName : 'Chưa đánh giá',
      winnerColor: bestCareer.offer.color,
      metric: bestCareer.score > 0 ? `${bestCareer.score}/5 ⭐` : 'N/A',
      icon: 'career',
    },
    {
      label: 'Tổng thể tốt nhất',
      winnerId: bestOverall.score > 0 ? bestOverall.offer.id : null,
      winnerName: bestOverall.score > 0 ? bestOverall.offer.companyName : 'Chưa đủ dữ liệu',
      winnerColor: bestOverall.offer.color,
      metric: bestOverall.score > 0 ? `${bestOverall.score.toFixed(1)}/5` : 'N/A',
      icon: 'overall',
    },
  ];
}
