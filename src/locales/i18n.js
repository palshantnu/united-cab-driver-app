import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from './en.json';
import hi from './hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: cb => {
    const locales = RNLocalize.getLocales();
    cb(locales[0]?.languageCode || 'en');
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
