"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Check, ChevronDown, Globe2 } from "lucide-react";

type LanguageCode = "zh-CN" | "zh-TW" | "en";

type GoogleTranslateWindow = Window & {
  googleTranslateElementInit?: () => void;
  google?: {
    translate?: {
      TranslateElement?: new (
        options: {
          pageLanguage: string;
          includedLanguages: string;
          autoDisplay: boolean;
        },
        elementId: string,
      ) => unknown;
    };
  };
};

const languages: Array<{
  code: LanguageCode;
  label: string;
  shortLabel: string;
  googleCode?: string;
}> = [
  { code: "zh-CN", label: "简体中文", shortLabel: "中" },
  { code: "zh-TW", label: "繁體中文", shortLabel: "繁", googleCode: "zh-TW" },
  { code: "en", label: "English", shortLabel: "EN", googleCode: "en" },
];

const storageKey = "gptplusapp-language";
const sourceLanguage = "zh-CN";

function readTranslateCookie() {
  if (typeof document === "undefined") {
    return undefined;
  }

  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function getCurrentLanguage(): LanguageCode {
  if (typeof window === "undefined") {
    return sourceLanguage;
  }

  const fromCookie = readTranslateCookie();
  if (fromCookie?.endsWith("/en")) {
    return "en";
  }
  if (fromCookie?.endsWith("/zh-TW")) {
    return "zh-TW";
  }

  const stored = window.localStorage.getItem(storageKey);
  if (stored === "en" || stored === "zh-TW" || stored === "zh-CN") {
    return stored;
  }

  return sourceLanguage;
}

function getCookieDomain() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const { hostname } = window.location;
  if (hostname === "localhost" || /^\d+(?:\.\d+){3}$/.test(hostname)) {
    return undefined;
  }

  const parts = hostname.split(".");
  if (parts.length < 2) {
    return undefined;
  }

  return `.${parts.slice(-2).join(".")}`;
}

function writeTranslateCookie(language: LanguageCode) {
  const domain = getCookieDomain();
  const value = language === "zh-CN" ? "" : `/${sourceLanguage}/${language}`;
  const maxAge = language === "zh-CN" ? "0" : "31536000";
  const baseCookie = `googtrans=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;

  document.cookie = baseCookie;
  if (domain) {
    document.cookie = `${baseCookie}; domain=${domain}`;
  }
}

function applyGoogleTranslate(language: LanguageCode) {
  if (language === "zh-CN") {
    writeTranslateCookie(language);
    window.localStorage.setItem(storageKey, language);
    window.location.reload();
    return;
  }

  writeTranslateCookie(language);
  window.localStorage.setItem(storageKey, language);

  const googleCode = languages.find((item) => item.code === language)?.googleCode;
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");

  if (combo && googleCode) {
    combo.value = googleCode;
    combo.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  window.setTimeout(() => {
    const delayedCombo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (delayedCombo && googleCode) {
      delayedCombo.value = googleCode;
      delayedCombo.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      window.location.reload();
    }
  }, 500);
}

export function LanguageSwitcher() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("zh-CN");
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => languages.find((item) => item.code === selectedLanguage) ?? languages[0],
    [selectedLanguage],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSelectedLanguage(getCurrentLanguage());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    const translatorWindow = window as GoogleTranslateWindow;
    translatorWindow.googleTranslateElementInit = () => {
      const TranslateElement = translatorWindow.google?.translate?.TranslateElement;
      if (!TranslateElement || document.querySelector("#google_translate_element select")) {
        return;
      }

      new TranslateElement(
        {
          pageLanguage: sourceLanguage,
          includedLanguages: "zh-CN,zh-TW,en",
          autoDisplay: false,
        },
        "google_translate_element",
      );
    };

    return () => {
      delete translatorWindow.googleTranslateElementInit;
    };
  }, []);

  const chooseLanguage = (language: LanguageCode) => {
    setSelectedLanguage(language);
    setIsOpen(false);
    applyGoogleTranslate(language);
  };

  return (
    <div className="relative" ref={rootRef}>
      <div id="google_translate_element" className="hidden" aria-hidden="true" />
      <Script
        id="google-translate-widget"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="lazyOnload"
      />
      <button
        type="button"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d8c39b] bg-[#fffaf0] px-3 py-2 text-sm font-bold text-[#3a2817] transition hover:border-[#c99f55] hover:bg-[#fff5dc]"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((value) => !value)}
      >
        <Globe2 aria-hidden="true" className="size-4 text-[#9a6a2f]" />
        <span className="hidden sm:inline">{selectedOption.label}</span>
        <span className="sm:hidden">{selectedOption.shortLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 text-[#9a6a2f] transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-xl border border-[#d8c39b] bg-[#fffaf0] p-1 shadow-2xl shadow-[#2b2118]/15"
          role="menu"
        >
          {languages.map((language) => (
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold text-[#4b3724] transition hover:bg-[#fff5dc]"
              key={language.code}
              onClick={() => chooseLanguage(language.code)}
              role="menuitem"
            >
              <span>{language.label}</span>
              {selectedLanguage === language.code ? (
                <Check aria-hidden="true" className="size-4 text-[#9a6a2f]" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
