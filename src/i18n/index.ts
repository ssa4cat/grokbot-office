import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "./locales/en/common.json";
import enLayout from "./locales/en/layout.json";
import enOffice from "./locales/en/office.json";
import enPanels from "./locales/en/panels.json";
import zhCommon from "./locales/zh-Hant/common.json";
import zhLayout from "./locales/zh-Hant/layout.json";
import zhOffice from "./locales/zh-Hant/office.json";
import zhPanels from "./locales/zh-Hant/panels.json";

export const supportedLngs = ["zh-Hant", "en"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

export const namespaces = ["common", "layout", "office", "panels"] as const;

i18n.use(initReactI18next).init({
  resources: {
    "zh-Hant": {
      common: zhCommon,
      layout: zhLayout,
      office: zhOffice,
      panels: zhPanels,
    },
    en: {
      common: enCommon,
      layout: enLayout,
      office: enOffice,
      panels: enPanels,
    },
  },
  lng: "zh-Hant",
  supportedLngs: [...supportedLngs],
  fallbackLng: ["zh-Hant", "en"],
  defaultNS: "common",
  ns: [...namespaces],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
