import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(Backend)
  .init({
    fallbackLng: 'English',
    returnObjects: true,
    backend: {
      loadPath: '/admin/locales/{{lng}}/translation.json'
    }
  });

export default i18n;
