"use client";

import { create } from 'zustand';

interface Toast {
    id: string;
    title: string;
    description: string;
    variant: 'default' | 'destructive';
}

interface ToastState {
    toasts: Toast[];
    showToast: (title: string, description: string, variant?: 'default' | 'destructive') => void;
    hideToast: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
    toasts: [],
    showToast: (title, description, variant = 'default') => {
        if (typeof window !== 'undefined') {
            const isLoggingOut = sessionStorage.getItem('user_logged_out') === 'true';

            if (isLoggingOut && title !== "Logged Out" && !title.includes("Logout")) {
                console.log("During logout process, blocking non-logout related toast:", title);
                return;
            }
        }

        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, title, description, variant }]
        }));
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((toast) => toast.id !== id)
            }));
        }, 3000);
    },
    hideToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id)
        }));
    }
})); 