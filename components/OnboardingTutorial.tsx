'use client'

import { useState, useEffect } from 'react'
import { useLocale } from '@/lib/i18n/LocaleContext'

export const ONBOARDING_STORAGE_KEY = 'amauta_onboarding_done'

export default function OnboardingTutorial() {
  const { t } = useLocale()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!done) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
    setVisible(false)
  }

  function next() {
    if (step < 6) setStep(s => s + 1)
    else dismiss()
  }

  if (!visible) return null

  const steps = [
    { emoji: '👋', title: t('onboarding.step0_title'), desc: t('onboarding.step0_desc') },
    { emoji: '⚡', title: t('onboarding.step1_title'), desc: t('onboarding.step1_desc') },
    { emoji: '✅', title: t('onboarding.step2_title'), desc: t('onboarding.step2_desc') },
    { emoji: '🎯', title: t('onboarding.step6_title'), desc: t('onboarding.step6_desc') },
    { emoji: '💰', title: t('onboarding.step3_title'), desc: t('onboarding.step3_desc') },
    { emoji: '📋', title: t('onboarding.step4_title'), desc: t('onboarding.step4_desc') },
    { emoji: '📚', title: t('onboarding.step5_title'), desc: t('onboarding.step5_desc') },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'linear-gradient(160deg, #1a0f35 0%, #0f0a2e 100%)',
        border: '1px solid rgba(139,92,246,0.35)',
        borderRadius: '20px', padding: '2rem 1.75rem 1.75rem',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>
        {/* Header: emoji + paso X de Y + omitir */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem',
          }}>
            {current.emoji}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>
              {step + 1} / {steps.length}
            </span>
            <button
              onClick={dismiss}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer',
                padding: '0.25rem 0.625rem', borderRadius: '6px',
              }}
            >
              {t('onboarding.omitir')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          <h2 style={{
            margin: '0 0 0.625rem', fontSize: '1.2rem', fontWeight: 800,
            color: '#fff', lineHeight: 1.25,
          }}>
            {current.title}
          </h2>
          <p style={{
            margin: 0, color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.65,
          }}>
            {current.desc}
          </p>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '20px' : '6px', height: '6px',
              borderRadius: '99px', transition: 'all 0.25s',
              background: i === step ? '#8B5CF6' : i < step ? 'rgba(139,92,246,0.45)' : 'rgba(139,92,246,0.2)',
            }} />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={next}
          style={{
            width: '100%', padding: '0.875rem', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            color: 'white', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          {isLast ? t('onboarding.empezar') : t('onboarding.siguiente')}
        </button>
      </div>
    </div>
  )
}
