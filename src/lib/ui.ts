import { writable } from 'svelte/store';
import type { Toast } from './types';
import { newId } from './utils';
import { ToastType } from './enums';

export const toasts = writable<Toast[]>([]);

export const addToast = (toast: Toast) => {
	const defaults = {
		id: newId(),
		type: ToastType.Info,
		dismissible: true,
		timeout: 3000
	};

	toast = { ...defaults, ...toast };
	toasts.update((all) => [toast, ...all]);

	if (toast.timeout) {
		setTimeout(() => dismissToast(toast.id), toast.timeout);
	}
};

export const addInfoToast = (message: string) =>
	addToast({ message, type: ToastType.Info })

export const addSuccessToast = (message: string) =>
	addToast({ message, type: ToastType.Success })

export const addErrorToast = (message: string) =>
	addToast({ message, type: ToastType.Error })


export const dismissToast = (id?: string) => {
	toasts.update((all) => all.filter((t) => t.id !== id));
};
