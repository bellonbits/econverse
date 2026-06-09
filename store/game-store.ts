import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Player,
  Economy,
  Business,
  Investment,
  Property,
  Loan,
  BankAccount,
  Transaction,
  MarketAsset,
  GameEvent,
  MentorMessage,
  Government,
} from "@/types/game";

interface GameState {
  // Player
  player: Player | null;
  setPlayer: (player: Player | null) => void;
  updatePlayer: (updates: Partial<Player>) => void;

  // Economy
  economy: Economy | null;
  setEconomy: (economy: Economy | null) => void;

  // Assets
  businesses: Business[];
  setBusinesses: (businesses: Business[]) => void;
  addBusiness: (business: Business) => void;
  updateBusiness: (id: string, updates: Partial<Business>) => void;

  investments: Investment[];
  setInvestments: (investments: Investment[]) => void;

  properties: Property[];
  setProperties: (properties: Property[]) => void;

  loans: Loan[];
  setLoans: (loans: Loan[]) => void;

  bankAccounts: BankAccount[];
  setBankAccounts: (accounts: BankAccount[]) => void;

  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;

  // Markets
  markets: MarketAsset[];
  setMarkets: (markets: MarketAsset[]) => void;

  // Events
  activeEvents: GameEvent[];
  setActiveEvents: (events: GameEvent[]) => void;
  eventHistory: GameEvent[];
  addEventToHistory: (event: GameEvent) => void;

  // Government
  government: Government | null;
  setGovernment: (gov: Government | null) => void;

  // AI Mentor
  mentorMessages: MentorMessage[];
  addMentorMessage: (msg: MentorMessage) => void;
  dismissMentorMessage: (id: string) => void;
  isMentorOpen: boolean;
  setMentorOpen: (open: boolean) => void;

  // UI State
  isGameLoading: boolean;
  setGameLoading: (loading: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notification: { message: string; type: "success" | "error" | "info" | "warning" } | null;
  showNotification: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  clearNotification: () => void;

  // Game time
  isTimePaused: boolean;
  setTimePaused: (paused: boolean) => void;
  gameSpeed: 1 | 2 | 5 | 10;
  setGameSpeed: (speed: 1 | 2 | 5 | 10) => void;

  // Reset
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      player: null,
      setPlayer: (player) => set({ player }),
      updatePlayer: (updates) =>
        set((state) => ({
          player: state.player ? { ...state.player, ...updates } : null,
        })),

      economy: null,
      setEconomy: (economy) => set({ economy }),

      businesses: [],
      setBusinesses: (businesses) => set({ businesses }),
      addBusiness: (business) =>
        set((state) => ({ businesses: [...state.businesses, business] })),
      updateBusiness: (id, updates) =>
        set((state) => ({
          businesses: state.businesses.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      investments: [],
      setInvestments: (investments) => set({ investments }),

      properties: [],
      setProperties: (properties) => set({ properties }),

      loans: [],
      setLoans: (loans) => set({ loans }),

      bankAccounts: [],
      setBankAccounts: (bankAccounts) => set({ bankAccounts }),

      transactions: [],
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions].slice(0, 100),
        })),

      markets: [],
      setMarkets: (markets) => set({ markets }),

      activeEvents: [],
      setActiveEvents: (activeEvents) => set({ activeEvents }),
      eventHistory: [],
      addEventToHistory: (event) =>
        set((state) => ({
          eventHistory: [event, ...state.eventHistory].slice(0, 20),
        })),

      government: null,
      setGovernment: (government) => set({ government }),

      mentorMessages: [],
      addMentorMessage: (msg) =>
        set((state) => ({
          mentorMessages: [msg, ...state.mentorMessages].slice(0, 5),
        })),
      dismissMentorMessage: (id) =>
        set((state) => ({
          mentorMessages: state.mentorMessages.filter((m) => m.id !== id),
        })),
      isMentorOpen: false,
      setMentorOpen: (isMentorOpen) => set({ isMentorOpen }),

      isGameLoading: false,
      setGameLoading: (isGameLoading) => set({ isGameLoading }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      activeTab: "dashboard",
      setActiveTab: (activeTab) => set({ activeTab }),
      notification: null,
      showNotification: (message, type = "info") =>
        set({ notification: { message, type } }),
      clearNotification: () => set({ notification: null }),

      isTimePaused: false,
      setTimePaused: (isTimePaused) => set({ isTimePaused }),
      gameSpeed: 1,
      setGameSpeed: (gameSpeed) => set({ gameSpeed }),

      resetGame: () =>
        set({
          player: null,
          economy: null,
          businesses: [],
          investments: [],
          properties: [],
          loans: [],
          bankAccounts: [],
          transactions: [],
          markets: [],
          activeEvents: [],
          eventHistory: [],
          government: null,
          mentorMessages: [],
          isMentorOpen: false,
        }),
    }),
    {
      name: "econoverse-game",
      partialize: (state) => ({
        player: state.player,
        sidebarCollapsed: state.sidebarCollapsed,
        gameSpeed: state.gameSpeed,
      }),
    }
  )
);
