'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Offer, Criterion, CriterionValue, ChatMessage } from '@/types';
import { DEFAULT_CRITERIA, OFFER_COLORS } from '@/data/criteria';

interface AppUser {
  name: string | null;
  email: string;
  avatar: string | null;
}

interface AppState {
  // Data loading
  isLoaded: boolean;
  loadFromDb: () => Promise<void>;

  // User
  user: AppUser | null;



  // Offers
  offers: Offer[];
  addOffer: (offer: Omit<Offer, 'id' | 'color'>) => void;
  updateOffer: (id: string, offer: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  updateOfferValue: (offerId: string, criterionId: string, value: string | number | boolean, note?: string) => void;

  // Criteria
  criteria: Criterion[];
  addCriterion: (criterion: Omit<Criterion, 'id' | 'isCustom'>) => void;
  deleteCriterion: (id: string) => void;

  // Compare
  selectedOfferIds: string[];
  toggleOfferSelection: (id: string) => void;
  selectAllOffers: () => void;
  clearSelection: () => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  clearChat: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

// ─── API helpers (fire-and-forget for writes, await for reads) ───

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

function apiPost(url: string, body: unknown) {
  api(url, { method: 'POST', body: JSON.stringify(body) }).catch(console.error);
}

function apiPut(url: string, body: unknown) {
  api(url, { method: 'PUT', body: JSON.stringify(body) }).catch(console.error);
}

function apiDelete(url: string, body: unknown) {
  api(url, { method: 'DELETE', body: JSON.stringify(body) }).catch(console.error);
}

// ─── DB row → App type converters ───

interface DbOffer {
  id: string;
  companyName: string;
  position: string;
  logo?: string | null;
  color: string;
  date?: string | null;
  status: string;
  isCurrent: boolean;
  overallRating?: number | null;
  values: CriterionValue[];
  notes?: string | null;
  deadline?: string | null;
}

interface DbCriterion {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  type: string;
}

interface DbChatMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

function toOffer(row: DbOffer): Offer {
  return {
    id: row.id,
    companyName: row.companyName,
    position: row.position,
    logo: row.logo || undefined,
    color: row.color,
    date: row.date || '',
    status: row.status as Offer['status'],
    isCurrent: row.isCurrent,
    overallRating: row.overallRating || undefined,
    values: row.values || [],
    notes: row.notes || undefined,
    deadline: row.deadline || undefined,
  };
}

function toCriterion(row: DbCriterion): Criterion {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Criterion['category'],
    description: row.description || '',
    type: row.type as Criterion['type'],
    isCustom: true,
  };
}

function toChatMessage(row: DbChatMessage): ChatMessage {
  return {
    id: row.id,
    role: row.role as ChatMessage['role'],
    content: row.content,
    timestamp: new Date(row.timestamp),
  };
}

// ─── Store ───

export const useStore = create<AppState>()((set, get) => ({
  // Data loading
  isLoaded: false,
  loadFromDb: async () => {
    if (get().isLoaded) return;
    try {
      const [offersRaw, criteriaRaw, messagesRaw, userRaw] = await Promise.all([
        api<DbOffer[]>('/api/offers'),
        api<DbCriterion[]>('/api/criteria'),
        api<DbChatMessage[]>('/api/messages'),
        api<AppUser | null>('/api/user'),
      ]);
      const customCriteria = criteriaRaw.map(toCriterion);
      set({
        offers: offersRaw.map(toOffer),
        criteria: [...DEFAULT_CRITERIA, ...customCriteria],
        chatMessages: messagesRaw.map(toChatMessage),
        user: userRaw,
        isLoaded: true,
      });
    } catch (err) {
      console.error('Failed to load from DB:', err);
      set({ isLoaded: true }); // proceed with defaults
    }
  },

  // User
  user: null,


  // Offers
  offers: [],
  addOffer: (offer) => {
    const { offers } = get();
    const color = OFFER_COLORS[offers.length % OFFER_COLORS.length];
    const isCurrent = offer.status === 'current';
    const newOffer: Offer = { ...offer, id: uuidv4(), color, isCurrent };
    set({ offers: [...offers, newOffer] });
    apiPost('/api/offers', newOffer);
  },
  updateOffer: (id, updates) => {
    const updated = get().offers.map((o) => (o.id === id ? { ...o, ...updates } : o));
    set({ offers: updated });
    const offer = updated.find((o) => o.id === id);
    if (offer) apiPost('/api/offers', offer);
  },
  deleteOffer: (id) => {
    set({
      offers: get().offers.filter((o) => o.id !== id),
      selectedOfferIds: get().selectedOfferIds.filter((sid) => sid !== id),
    });
    apiDelete('/api/offers', { id });
  },
  updateOfferValue: (offerId, criterionId, value, note) => {
    const updated = get().offers.map((o) => {
      if (o.id !== offerId) return o;
      const existingIdx = o.values.findIndex((v) => v.criterionId === criterionId);
      const newValue: CriterionValue = { criterionId, value, note };
      const newValues = [...o.values];
      if (existingIdx >= 0) {
        newValues[existingIdx] = newValue;
      } else {
        newValues.push(newValue);
      }
      return { ...o, values: newValues };
    });
    set({ offers: updated });
    const offer = updated.find((o) => o.id === offerId);
    if (offer) apiPost('/api/offers', offer);
  },

  // Criteria
  criteria: DEFAULT_CRITERIA,
  addCriterion: (criterion) => {
    const newCriterion: Criterion = { ...criterion, id: uuidv4(), isCustom: true };
    set({ criteria: [...get().criteria, newCriterion] });
    apiPost('/api/criteria', {
      id: newCriterion.id,
      name: newCriterion.name,
      category: newCriterion.category,
      description: newCriterion.description,
      type: newCriterion.type,
    });
  },
  deleteCriterion: (id) => {
    const criterion = get().criteria.find((c) => c.id === id);
    if (criterion?.isCustom) {
      set({ criteria: get().criteria.filter((c) => c.id !== id) });
      apiDelete('/api/criteria', { id });
    }
  },

  // Compare
  selectedOfferIds: [],
  toggleOfferSelection: (id) => {
    const { selectedOfferIds } = get();
    if (selectedOfferIds.includes(id)) {
      set({ selectedOfferIds: selectedOfferIds.filter((sid) => sid !== id) });
    } else {
      set({ selectedOfferIds: [...selectedOfferIds, id] });
    }
  },
  selectAllOffers: () => {
    set({ selectedOfferIds: get().offers.map((o) => o.id) });
  },
  clearSelection: () => set({ selectedOfferIds: [] }),

  // Chat
  chatMessages: [],
  addChatMessage: (message) => {
    const newMsg: ChatMessage = { ...message, id: uuidv4(), timestamp: new Date() };
    set({ chatMessages: [...get().chatMessages, newMsg] });
    apiPost('/api/messages', {
      id: newMsg.id,
      role: newMsg.role,
      content: newMsg.content,
      timestamp: newMsg.timestamp.toISOString(),
    });
  },
  updateLastMessage: (content: string) => {
    const messages = [...get().chatMessages];
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      messages[messages.length - 1] = { ...last, content };
      set({ chatMessages: messages });
      // Debounced save — only save final content via stream [DONE] in AIAssistant
      // We still sync here for non-streaming updates
      apiPut('/api/messages', { id: last.id, content });
    }
  },
  clearChat: () => {
    set({ chatMessages: [] });
    apiDelete('/api/messages', {});
  },

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
}));
