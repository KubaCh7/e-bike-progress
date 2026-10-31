import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { legalContent, type LegalDoc } from '../legal/content'
import { Modal } from './Modal'
import { Segmented } from './Segmented'

const HASH: Record<LegalDoc, string> = { privacy: '#prywatnosc', terms: '#regulamin', notices: '#informacje' }
const fromHash = (hash: string): LegalDoc | null =>
  (Object.entries(HASH).find(([, h]) => h === hash)?.[0] as LegalDoc | undefined) ?? null

/** Dokumenty prawne jako arkusz – otwierane linkiem #prywatnosc / #regulamin / #informacje (działa też przed logowaniem). */
export function LegalSheet() {
  const { t, i18n } = useTranslation()
  const [doc, setDoc] = useState<LegalDoc | null>(() => fromHash(window.location.hash))

  useEffect(() => {
    const onHash = () => setDoc(fromHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (!doc) return null
  const content = legalContent(i18n.language === 'en' ? 'en' : 'pl')
  const close = () => {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setDoc(null)
  }

  return (
    <Modal title={content[doc].title} onClose={close} wide>
      <Segmented
        block
        className="glass--clear"
        label={t('legal.title')}
        value={doc}
        onChange={(d) => {
          history.replaceState(null, '', HASH[d])
          setDoc(d)
        }}
        options={[
          { value: 'privacy', label: t('legal.privacy') },
          { value: 'terms', label: t('legal.terms') },
          { value: 'notices', label: t('legal.notices') },
        ]}
      />
      <article key={doc} className="legal">
        {content[doc].sections.map((s) => (
          <section key={s.title}>
            <h3>{s.title}</h3>
            {s.body.map((p, i) => (
              <p key={i}>{linkify(p)}</p>
            ))}
          </section>
        ))}
      </article>
    </Modal>
  )
}

/** Adresy https w tekście jako klikalne linki. */
function linkify(text: string) {
  const parts = text.split(/(https?:\/\/\S+)/g)
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer">
        {part.replace(/^https?:\/\//, '').slice(0, 60)}
      </a>
    ) : (
      part
    ),
  )
}

/** Stopka z linkami do dokumentów prawnych. */
export function LegalFooter() {
  const { t } = useTranslation()
  return (
    <footer className="legal-footer">
      <a href="#prywatnosc">{t('legal.privacy')}</a>
      <a href="#regulamin">{t('legal.terms')}</a>
      <a href="#informacje">{t('legal.notices')}</a>
      <span>© 2026 e-bike progress · {t('legal.independent')}</span>
    </footer>
  )
}
