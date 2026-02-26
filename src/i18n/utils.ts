import { ui, defaultLang } from './ui';

const normalizePath = (path: string) => {
  if (!path) return '/';
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  if (withLeading.length > 1 && withLeading.endsWith('/')) {
    return withLeading.slice(0, -1);
  }
  return withLeading;
};

export const slugTranslations = {
  pl: {
    '/praktyki': '/practices',
    '/rekolekcje': '/retreats',
    '/events/letni-retreat': '/events/summer-retreat',
    '/events/navaratri-festiwal': '/events/navaratri-festival',
    '/events/poniedzialkowo-havan': '/events/monday-havan',
    '/events/wiosenny-retreat': '/events/spring-retreat',
    '/teachings/aarti-ceremonia': '/teachings/aarti-ceremony',
    '/teachings/havan-ogien': '/teachings/sacred-fire-ceremony',
    '/teachings/medytacja-dla-poczatkujacych': '/teachings/meditation-for-beginners',
    '/teachings/prawda-prostocie-milosc': '/teachings/truth-simplicity-love',
  },
  en: {
    '/practices': '/praktyki',
    '/retreats': '/rekolekcje',
    '/events/summer-retreat': '/events/letni-retreat',
    '/events/navaratri-festival': '/events/navaratri-festiwal',
    '/events/monday-havan': '/events/poniedzialkowo-havan',
    '/events/spring-retreat': '/events/wiosenny-retreat',
    '/teachings/aarti-ceremony': '/teachings/aarti-ceremonia',
    '/teachings/sacred-fire-ceremony': '/teachings/havan-ogien',
    '/teachings/meditation-for-beginners': '/teachings/medytacja-dla-poczatkujacych',
    '/teachings/truth-simplicity-love': '/teachings/prawda-prostocie-milosc',
  },
} as const;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function getLocalizedPath(path: string, lang: keyof typeof ui): string {
  const normalizedPath = normalizePath(path);

  if (lang === defaultLang) {
    return normalizedPath;
  }

  return normalizedPath === '/' ? `/${lang}` : `/${lang}${normalizedPath}`;
}

export function translatePath(
  path: string,
  fromLang: keyof typeof ui,
  toLang: keyof typeof ui
): string {
  const normalizedPath = normalizePath(path);
  if (fromLang === toLang) {
    return normalizedPath;
  }

  const withoutLocale = fromLang === 'en'
    ? normalizedPath.replace(/^\/en(?=\/|$)/, '')
    : normalizedPath;
  const cleanPath = withoutLocale === '' ? '/' : withoutLocale;
  const map = fromLang === 'pl' ? slugTranslations.pl : slugTranslations.en;
  const translated = map[cleanPath as keyof typeof map];

  if (toLang === defaultLang) {
    return translated ?? cleanPath;
  }

  const targetPath = translated ?? (cleanPath === '/' ? '' : cleanPath);
  return targetPath ? `/${toLang}${targetPath}` : `/${toLang}`;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)['pl']) {
    return ui[lang][key as keyof typeof ui[typeof lang]] || ui[defaultLang][key as keyof typeof ui[typeof defaultLang]];
  }
}
