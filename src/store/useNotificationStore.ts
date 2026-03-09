import { create } from 'zustand'

export interface RealtimeNotification {
  id: string
  type: 'alert' | 'crisis' | 'test'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  patientName?: string
  patientId?: string
  timestamp: string
  read: boolean
}

interface NotificationStore {
  notifications: RealtimeNotification[]
  addNotification: (n: RealtimeNotification) => void
  markAllRead: () => void
  clear: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 50),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  clear: () => set({ notifications: [] }),
}))
