import { create } from 'zustand';
import { translations } from '../i18n/translations';

type Lang = 'en' | 'ar';

interface LanguageState {
  lang: Lang;
  toggle: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: (localStorage.getItem('lang') as Lang) || 'en',
  toggle: () =>
    set((state) => {
      const next = state.lang === 'en' ? 'ar' : 'en';
      localStorage.setItem('lang', next);
      return { lang: next };
    }),
}));

export function t(key: string): string {
  const { lang } = useLanguageStore.getState();
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}
