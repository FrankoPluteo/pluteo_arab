'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/recommendation.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';

interface ResultProduct {
  id: string;
  name: string;
  brand: { name: string };
  price: number;
  discountAmount: number;
  images: string[];
  concentration: string;
  size: number;
}

interface RecommendationResult {
  product: ResultProduct;
  reason: string;
}

type Mode = 'quiz' | 'freeform';
type Status = 'idle' | 'loading' | 'success' | 'error';

const FREEFORM_LIMIT = 300;
const FREEFORM_MIN = 20;

function Toggle({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
    >
      {label}
    </button>
  );
}

export default function RecommendationContent() {
  const { t, language } = useLanguage();
  const q = t.quiz;

  const [mode, setMode] = useState<Mode | null>(null);

  // Quiz state
  const [occasion, setOccasion] = useState('');
  const [intensity, setIntensity] = useState('');
  const [scents, setScents] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [budget, setBudget] = useState('');

  // Freeform state
  const [freeformText, setFreeformText] = useState('');

  // Shared state
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [validationMsg, setValidationMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [note, setNote] = useState('');

  function toggleScent(scent: string) {
    setScents((prev) =>
      prev.includes(scent) ? prev.filter((s) => s !== scent) : [...prev, scent]
    );
  }

  function handleModeSelect(m: Mode) {
    setMode(m);
    setStatus('idle');
    setResults([]);
    setValidationMsg('');
    setErrorMsg('');
    setNote('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationMsg('');

    let body: Record<string, unknown>;

    if (mode === 'quiz') {
      if (!scents.length) {
        setValidationMsg(q.selectScents);
        return;
      }
      body = { mode: 'quiz', occasion, intensity, scents, gender, budget, language };
    } else {
      if (freeformText.trim().length < FREEFORM_MIN) return;
      body = { mode: 'freeform', description: freeformText.slice(0, FREEFORM_LIMIT), gender, language };
    }

    setStatus('loading');
    setResults([]);
    setErrorMsg('');
    setNote('');

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMsg(typeof data?.message === 'string' ? data.message : q.errorMessage);
        setStatus('error');
        return;
      }

      const data = await res.json();
      setResults(data.results ?? []);
      setNote(typeof data.note === 'string' ? data.note : '');
      setStatus('success');

      setTimeout(() => {
        document.getElementById('quiz-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      setErrorMsg(q.errorMessage);
      setStatus('error');
    }
  }

  const occasionOptions = [
    { value: q.occasionEveryday, label: q.occasionEveryday },
    { value: q.occasionWork, label: q.occasionWork },
    { value: q.occasionEvening, label: q.occasionEvening },
    { value: q.occasionSpecial, label: q.occasionSpecial },
  ];

  const intensityOptions = [
    { value: q.intensityLight, label: q.intensityLight },
    { value: q.intensityModerate, label: q.intensityModerate },
    { value: q.intensityIntense, label: q.intensityIntense },
  ];

  const scentOptions = [
    { value: 'Oud', label: q.scentOud },
    { value: q.scentVanilla, label: q.scentVanilla },
    { value: q.scentFloral, label: q.scentFloral },
    { value: q.scentFresh, label: q.scentFresh },
    { value: q.scentWoody, label: q.scentWoody },
    { value: q.scentSpicy, label: q.scentSpicy },
    { value: q.scentSweet, label: q.scentSweet },
  ];

  const genderOptions = [
    { value: 'male', label: q.genderMale },
    { value: 'female', label: q.genderFemale },
  ];

  const budgetOptions = [
    { value: 'under30', label: q.budgetUnder30 },
    { value: '30-50', label: q.budget3050 },
    { value: 'over50', label: q.budgetOver50 },
  ];

  const isQuizValid = !!(occasion && intensity && scents.length > 0 && gender && budget);
  const isFreeformValid = freeformText.trim().length >= FREEFORM_MIN && !!gender;
  const isFormValid = mode === 'quiz' ? isQuizValid : isFreeformValid;

  const charRatio = freeformText.length / FREEFORM_LIMIT;
  const charCountClass =
    freeformText.length >= FREEFORM_LIMIT
      ? styles.charCountLimit
      : charRatio >= 0.8
      ? styles.charCountWarn
      : '';

  return (
    <div>
      <Navbar />

      <div className={styles.pageContainer}>
        <div className={styles.logoContainer}>
          <Image src={logoIcon} alt="Pluteo" width={52} height={52} />
        </div>
        <h1 className={styles.pageTitle}>{q.pageTitle}</h1>
        <p className={styles.pageSubtitle}>{q.pageSubtitle}</p>

        {/* ── Mode selector ── */}
        {mode === null && (
          <div className={styles.modeSelector}>
            <p className={styles.modeSelectorLabel}>{q.chooseMode}</p>
            <div className={styles.modeGrid}>
              <button
                type="button"
                className={styles.modeCard}
                onClick={() => handleModeSelect('quiz')}
              >
                <span className={styles.modeCardTitle}>{q.modeQuiz}</span>
                <span className={styles.modeCardDesc}>{q.modeQuizDesc}</span>
              </button>
              <button
                type="button"
                className={styles.modeCard}
                onClick={() => handleModeSelect('freeform')}
              >
                <span className={styles.modeCardTitle}>{q.modeFreeform}</span>
                <span className={styles.modeCardDesc}>{q.modeFreeformDesc}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Quiz form ── */}
        {mode === 'quiz' && (
          <>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setMode(null)}
            >
              ← {q.changeMode}
            </button>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.question}>
                <p className={styles.questionLabel}>{q.occasionTitle}</p>
                <div className={styles.optionsRow}>
                  {occasionOptions.map((opt) => (
                    <Toggle
                      key={opt.value}
                      label={opt.label}
                      selected={occasion === opt.value}
                      onClick={() => setOccasion(opt.value)}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.question}>
                <p className={styles.questionLabel}>{q.intensityTitle}</p>
                <div className={styles.optionsRow}>
                  {intensityOptions.map((opt) => (
                    <Toggle
                      key={opt.value}
                      label={opt.label}
                      selected={intensity === opt.value}
                      onClick={() => setIntensity(opt.value)}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.question}>
                <p className={styles.questionLabel}>{q.scentsTitle}</p>
                <p className={styles.scentsHint}>{q.scentsHint}</p>
                <div className={styles.optionsRow}>
                  {scentOptions.map((opt) => (
                    <Toggle
                      key={opt.value}
                      label={opt.label}
                      selected={scents.includes(opt.value)}
                      onClick={() => toggleScent(opt.value)}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.question}>
                <p className={styles.questionLabel}>{q.genderTitle}</p>
                <div className={styles.optionsRow}>
                  {genderOptions.map((opt) => (
                    <Toggle
                      key={opt.value}
                      label={opt.label}
                      selected={gender === opt.value}
                      onClick={() => setGender(opt.value)}
                    />
                  ))}
                </div>
                <p className={styles.scentsHint}>{q.genderNote}</p>
              </div>

              <div className={styles.question}>
                <p className={styles.questionLabel}>{q.budgetTitle}</p>
                <div className={styles.optionsRow}>
                  {budgetOptions.map((opt) => (
                    <Toggle
                      key={opt.value}
                      label={opt.label}
                      selected={budget === opt.value}
                      onClick={() => setBudget(opt.value)}
                    />
                  ))}
                </div>
              </div>

              {validationMsg && (
                <p className={styles.validationMessage}>{validationMsg}</p>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!isFormValid || status === 'loading'}
              >
                {status === 'loading' ? q.loading : q.submit}
              </button>
            </form>
          </>
        )}

        {/* ── Freeform form ── */}
        {mode === 'freeform' && (
          <>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setMode(null)}
            >
              ← {q.changeMode}
            </button>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.question}>
                <p className={styles.questionLabel}>{q.genderTitle}</p>
                <div className={styles.optionsRow}>
                  {genderOptions.map((opt) => (
                    <Toggle
                      key={opt.value}
                      label={opt.label}
                      selected={gender === opt.value}
                      onClick={() => setGender(opt.value)}
                    />
                  ))}
                </div>
                <p className={styles.scentsHint}>{q.genderNote}</p>
              </div>

              <div className={styles.question}>
                <p className={styles.questionLabel}>{q.freeformTitle}</p>
                <div className={styles.freeformWrapper}>
                  <textarea
                    className={styles.freeformTextarea}
                    value={freeformText}
                    onChange={(e) =>
                      setFreeformText(e.target.value.slice(0, FREEFORM_LIMIT))
                    }
                    placeholder={q.freeformPlaceholder}
                    rows={5}
                    maxLength={FREEFORM_LIMIT}
                  />
                  <p className={`${styles.charCount} ${charCountClass}`}>
                    {freeformText.length}/{FREEFORM_LIMIT}
                  </p>
                </div>
                <p className={styles.scentsHint}>{q.freeformHint}</p>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!isFreeformValid || status === 'loading'}
              >
                {status === 'loading' ? q.freeformLoading : q.freeformSubmit}
              </button>
            </form>
          </>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <p className={styles.errorMessage}>{errorMsg || q.errorMessage}</p>
        )}

        {/* ── Results ── */}
        {status === 'success' && (
          <section id="quiz-results" className={styles.resultsSection}>
            <div className={styles.resultsDivider} />
            <h2 className={styles.resultsTitle}>{q.resultsTitle}</h2>
            {note && <p className={styles.scentsHint}>{note}</p>}

            {results.length === 0 ? (
              <p className={styles.errorMessage}>{q.noResults}</p>
            ) : (
              <div className={styles.resultsGrid}>
                {results.map(({ product, reason }) => {
                  const finalPrice = product.price - product.discountAmount;
                  const hasDiscount = product.discountAmount > 0;
                  return (
                    <div key={product.id} className={styles.resultCard}>
                      <div className={styles.resultImageWrap}>
                        {product.images[0] ? (
                          <div className={styles.resultImageInner}>
                            <Image
                              src={product.images[0]}
                              alt={`${product.brand.name} ${product.name}`}
                              fill
                              style={{ objectFit: 'contain' }}
                              sizes="(max-width: 768px) 50vw, 280px"
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className={styles.resultInfo}>
                        <p className={styles.resultBrand}>{product.brand.name}</p>
                        <h3 className={styles.resultName}>{product.name}</h3>
                        <p className={styles.resultDetails}>
                          {product.concentration} · {product.size}ml
                        </p>

                        <div className={styles.resultPricing}>
                          {hasDiscount && (
                            <span className={styles.resultOriginalPrice}>
                              €{product.price.toFixed(2)}
                            </span>
                          )}
                          <span className={styles.resultFinalPrice}>
                            €{finalPrice.toFixed(2)}
                          </span>
                        </div>

                        <div className={styles.reasonBlock}>
                          <p className={styles.reasonLabel}>{q.whyThis}</p>
                          <p className={styles.reasonText}>{reason}</p>
                        </div>

                        <Link href={`/products/${product.id}`} className={styles.viewBtn}>
                          {q.viewProduct}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
