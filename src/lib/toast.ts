export type ToastType = 'error' | 'success' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

type Listener = (toast: ToastMessage) => void;
let listeners: Listener[] = [];

export const toast = (title: string, message: string, type: ToastType = 'info') => {
  const newToast = { id: Math.random().toString(36).substring(2, 9), title, message, type };
  listeners.forEach(l => l(newToast));
};

export const subscribeToToasts = (listener: Listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};
