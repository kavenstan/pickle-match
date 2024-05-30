import { writable } from 'svelte/store';
import type { Session } from './types';

export const showModal = writable(false);

export const currentSession = writable<Session | null>(null);
