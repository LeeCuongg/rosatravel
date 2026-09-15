'use client'

import { CircleCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useId } from 'react'

import { submitBookingRequest, type BookingFormState } from '@/actions/booking'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'

import { FormMeta } from './FormMeta'

const initialState: BookingFormState = { status: 'idle' }

type NewsletterFormProps = {
  buttonLabel?: string | null
  successMessage?: string | null
  className?: string
}

/** Đăng ký nhận ưu đãi: chỉ cần tên và số điện thoại / Zalo. */
export function NewsletterForm({ buttonLabel, successMessage, className }: NewsletterFormProps) {
  const t = useTranslations('Newsletter')
  const tForm = useTranslations('BookingForm')
  const [state, formAction, pending] = useActionState(submitBookingRequest, initialState)
  const id = useId()

  if (state.status === 'success') {
    return (
      <p role="status" className={cn('animate-content-in flex items-start gap-3 text-body-md text-ink', className)}>
        <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-success" />
        <span className="whitespace-pre-line">{successMessage || t('success')}</span>
      </p>
    )
  }

  const values = state.status === 'error' ? state.values : {}
  const invalid = new Set(state.status === 'error' ? state.invalidFields : [])
  const messages =
    state.status !== 'error'
      ? []
      : state.reason === 'invalid'
        ? (['fullName', 'phone'] as const).filter((name) => invalid.has(name)).map((name) => tForm(`errors.${name}`))
        : [tForm(`errors.${state.reason}`)]

  return (
    <form action={formAction} className={cn('relative space-y-3', className)} aria-describedby={messages.length ? `${id}-error` : undefined}>
      <FormMeta type="newsletter" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`${id}-name`} className="sr-only">
          {t('fullName')}
        </label>
        <Input
          id={`${id}-name`}
          name="fullName"
          autoComplete="name"
          required
          maxLength={80}
          placeholder={t('fullName')}
          defaultValue={values.fullName}
          invalid={invalid.has('fullName')}
        />
        <label htmlFor={`${id}-phone`} className="sr-only">
          {t('phone')}
        </label>
        <Input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          maxLength={20}
          placeholder={t('phone')}
          defaultValue={values.phone}
          invalid={invalid.has('phone')}
        />
        <Button type="submit" disabled={pending} aria-disabled={pending}>
          {pending ? tForm('submitting') : buttonLabel || t('submit')}
        </Button>
      </div>
      {messages.length ? (
        <p id={`${id}-error`} role="alert" className="text-caption text-error">
          {messages.join(' ')}
        </p>
      ) : null}
    </form>
  )
}
