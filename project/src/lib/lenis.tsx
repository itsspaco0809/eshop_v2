import Lenis from 'lenis';

export let globalLenis: Lenis | null = null;

export const setGlobalLenis = (
  lenisInstance: Lenis | null
) => {
  globalLenis = lenisInstance;
};

export const getGlobalLenis = () => {
  return globalLenis;
};