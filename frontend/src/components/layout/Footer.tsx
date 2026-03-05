import { useLanguageStore, t } from '../../stores/languageStore';

export default function Footer() {
  useLanguageStore();
  return (
    <div className="page-footer">
      <p className="footer-quote">{t('footer.quote')}</p>
    </div>
  );
}
