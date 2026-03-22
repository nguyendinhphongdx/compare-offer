'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Offer, Criterion, CriterionValue, ChatMessage, PageView } from '@/types';
import { DEFAULT_CRITERIA, OFFER_COLORS } from '@/data/criteria';

interface AppState {
  // Navigation
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;

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
  clearChat: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),

      // Offers
      offers: [],
      addOffer: (offer) => {
        const { offers } = get();
        const color = OFFER_COLORS[offers.length % OFFER_COLORS.length];
        set({
          offers: [...offers, { ...offer, id: uuidv4(), color }],
        });
      },
      updateOffer: (id, updates) => {
        set({
          offers: get().offers.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        });
      },
      deleteOffer: (id) => {
        set({
          offers: get().offers.filter((o) => o.id !== id),
          selectedOfferIds: get().selectedOfferIds.filter((sid) => sid !== id),
        });
      },
      updateOfferValue: (offerId, criterionId, value, note) => {
        set({
          offers: get().offers.map((o) => {
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
          }),
        });
      },

      // Criteria
      criteria: DEFAULT_CRITERIA,
      addCriterion: (criterion) => {
        set({
          criteria: [
            ...get().criteria,
            { ...criterion, id: uuidv4(), isCustom: true },
          ],
        });
      },
      deleteCriterion: (id) => {
        const criterion = get().criteria.find((c) => c.id === id);
        if (criterion?.isCustom) {
          set({
            criteria: get().criteria.filter((c) => c.id !== id),
          });
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
        set({
          chatMessages: [
            ...get().chatMessages,
            { ...message, id: uuidv4(), timestamp: new Date() },
          ],
        });
      },
      clearChat: () => set({ chatMessages: [] }),

      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    {
      name: 'compare-offers-storage',
      partialize: (state) => ({
        offers: state.offers,
        criteria: state.criteria,
        selectedOfferIds: state.selectedOfferIds,
        chatMessages: state.chatMessages,
      }),
    }
  )
);
