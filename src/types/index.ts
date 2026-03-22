export interface Criterion {
  id: string;
  name: string;
  category: CriterionCategory;
  description: string;
  type: 'number' | 'text' | 'rating' | 'boolean' | 'salary';
  isCustom?: boolean;
}

export type CriterionCategory =
  | 'compensation'
  | 'benefits'
  | 'work_culture'
  | 'career_growth'
  | 'work_life_balance'
  | 'technical'
  | 'custom';

export interface CriterionValue {
  criterionId: string;
  value: string | number | boolean;
  note?: string;
}

export interface Offer {
  id: string;
  companyName: string;
  position: string;
  logo?: string;
  color: string;
  date: string;
  status: 'pending' | 'negotiating' | 'accepted' | 'declined';
  overallRating?: number;
  values: CriterionValue[];
  notes?: string;
  deadline?: string;
}

export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type PageView = 'dashboard' | 'offers' | 'compare' | 'charts' | 'interview' | 'assistant';
