import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "aegc-language",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

const updateDocumentLanguage = (language) => {
  document.documentElement.lang = language;
};

updateDocumentLanguage(i18n.resolvedLanguage || "fr");
i18n.on("languageChanged", updateDocumentLanguage);

export default i18n;