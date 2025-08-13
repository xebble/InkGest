'use client';

import { useLocale } from '../providers/LocaleProvider';
import { Locale } from '../../types';

interface LanguageSelectorProps {
  className?: string;
}

const languageNames: Record<Locale, { name: string; flag: string }> = {
  es: { name: 'Español', flag: '🇪🇸' },
  ca: { name: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  en: { name: 'English', flag: '🇬🇧' },
};

export function LanguageSelector({ className = '' }: LanguageSelectorProps): JSX.Element {
  const { locale, setLocale, availableLocales } = useLocale();

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="appearance-none bg-background border border-border rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        aria-label="Select language"
      >
        {availableLocales.map((lang) => (
          <option key={lang} value={lang}>
            {languageNames[lang].flag} {languageNames[lang].name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}

// Alternative button-based language selector
export function LanguageSelectorButton({ className = '' }: LanguageSelectorProps): JSX.Element {
  const { locale, setLocale, availableLocales } = useLocale();

  const currentLanguage = languageNames[locale];
  const nextLocaleIndex = (availableLocales.indexOf(locale) + 1) % availableLocales.length;
  const nextLocale = availableLocales[nextLocaleIndex];

  const toggleLanguage = (): void => {
    if (nextLocale) {
      setLocale(nextLocale);
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`p-2 rounded-md border border-border bg-background hover:bg-accent transition-colors flex items-center gap-2 ${className}`}
      aria-label={`Switch to ${nextLocale ? languageNames[nextLocale].name : 'next language'}`}
      title={`Current: ${currentLanguage.name}, Click to switch to ${nextLocale ? languageNames[nextLocale].name : 'next language'}`}
    >
      <span className="text-lg">{currentLanguage.flag}</span>
      <span className="text-sm font-medium">{currentLanguage.name}</span>
    </button>
  );
}