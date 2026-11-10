import { useCallback, useSyncExternalStore } from 'react';
import { ACTOR_STORAGE_KEY, DEFAULT_ACTOR } from '@/lib/actors';

/**
 * The simulated actor is global UI state: the header picks it and every
 * mutation attaches it. A tiny external store keeps it in sync across
 * components without a context provider or a state library.
 */
const listeners = new Set<() => void>();

const readStoredActor = (): string => {
  const stored = localStorage.getItem(ACTOR_STORAGE_KEY);
  return stored && stored.trim() ? stored : DEFAULT_ACTOR;
};

let actor = readStoredActor();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => actor;

export const useActor = () => {
  const value = useSyncExternalStore(subscribe, getSnapshot);

  const setActor = useCallback((next: string) => {
    actor = next;
    localStorage.setItem(ACTOR_STORAGE_KEY, next);
    listeners.forEach((listener) => listener());
  }, []);

  return { actor: value, setActor };
};
