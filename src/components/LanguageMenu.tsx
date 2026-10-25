import { useEffect, useRef, useState } from 'react';
import { LANGS } from '../i18n/ui';
import { useI18n } from '../i18n/useI18n';
import { useStore } from '../store/useStore';

/** Petit bouton de langue (coin de la barre du haut) : FR / EN / ES / PT. */
export function LanguageMenu() {
  const { lang, t } = useI18n();
  const setLang = useStore((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const current = LANGS.find((l) => l.id === lang)!;

  return (
    <div className="lang-menu" ref={ref}>
      <button
        className="btn lang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('language')} : ${current.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        🌐 {current.short}
      </button>
      {open && (
        <ul className="lang-list" role="listbox" aria-label={t('language')}>
          {LANGS.map((l) => (
            <li key={l.id}>
              <button
                role="option"
                aria-selected={l.id === lang}
                className={l.id === lang ? 'on' : ''}
                onClick={() => {
                  setLang(l.id);
                  setOpen(false);
                }}
              >
                <b>{l.short}</b> {l.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
