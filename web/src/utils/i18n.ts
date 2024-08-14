import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(Backend)
  .init({
    fallbackLng: 'en',
    returnObjects: true,
    backend: {
      loadPath: '/locales/{{lng}}/translation.json'
    }
  });

const savedLang: string = window.localStorage.getItem('i18nextLng') || 'en';
i18n.changeLanguage(savedLang);

export default i18n;
