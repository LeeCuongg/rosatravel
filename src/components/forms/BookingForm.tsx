'use client'

import { CircleCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { submitBookingRequest, type BookingFormState } from '@/actions/booking'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { BookingField } from '@/lib/booking/schema'
import { cn } from '@/lib/cn'

import { FormMeta } from './FormMeta'

export type DepartureOption = { value: string; label: string }

type BookingFormProps = {
  /** `booking`: đặt một tour cụ thể. `consultation`: nhờ tư vấn chung. */
  type: 'booking' | 'consultation'
  tourId?: string
  departures?: DepartureOption[]
  /** Lời cảm ơn do admin đặt; trống thì dùng câu mặc định. */
  successMessage?: string | null
  className?: string
}

const initialState: BookingFormState = { status: 'idle' }

export function BookingForm(props: BookingFormProps) {
  // Đổi key để dựng lại form sạch khi khách muốn gửi thêm yêu cầu.
  const [round, setRound] = useState(0)
  return <BookingFormBody key={round} {...props} onSendAnother={() => setRound((value) => value + 1)} />
}

function BookingFormBody({
  type,
  tourId,
  departures = [],
  successMessage,
  className,
  onSendAnother,
}: BookingFormProps & { onSendAnother: () => void }) {
  const t = useTranslations('BookingForm')
  const [state, formAction, pending] = useActionState(submitBookingRequest, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (state.status === 'success') successRef.current?.focus()
    if (state.status === 'error') {
      // Ưu tiên ô sai đầu tiên; lỗi chung (quá nhiều lần gửi, lỗi máy chủ) thì tới dòng thông báo.
      const form = formRef.current
      ;(form?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? form?.querySelector<HTMLElement>('[role="alert"]'))?.focus()
    }
  }, [state])

  if (state.status === 'success') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className={cn('animate-content-in space-y-3 rounded-md bg-canvas-soft p-6 focus-visible:outline-none', className)}
      >
        <CircleCheck aria-hidden className="size-8 text-success" />
        <p className="font-display text-display-xs font-semibold text-ink">{t('successTitle')}</p>
        <p className="text-body-md whitespace-pre-line text-body">{successMessage || t('successMessage')}</p>
        <Button variant="tertiary" size="sm" onClick={onSendAnother}>
          {t('sendAnother')}
        </Button>
      </div>
    )
  }

  const values = state.status === 'error' ? state.values : {}
  const invalid = new Set(state.status === 'error' ? state.invalidFields : [])
  const fieldProps = (name: BookingField) => ({
    id: `${id}-${name}`,
    name,
    invalid: invalid.has(name),
    'aria-describedby': invalid.has(name) ? `${id}-${name}-error` : undefined,
    defaultValue: values[name],
  })
  const field = (name: BookingField, label: string, control: ReactNode, optional = false) => (
    <div className="space-y-1.5">
      <label htmlFor={`${id}-${name}`} className="block text-body-sm font-semibold text-ink">
        {label} {optional ? <span className="font-normal text-body">{t('optional')}</span> : null}
      </label>
      {control}
      {invalid.has(name) ? (
        <p id={`${id}-${name}-error`} className="text-caption text-error">
          {t(`errors.${name}`)}
        </p>
      ) : null}
    </div>
  )

  return (
    <form ref={formRef} action={formAction} className={cn('relative space-y-5', className)}>
      <FormMeta type={type} tourId={tourId} />

      {state.status === 'error' ? (
        <p role="alert" tabIndex={-1} className="rounded-sm bg-error/10 px-4 py-3 text-body-sm text-error focus-visible:outline-none">
          {t(`errors.${state.reason}`)}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        {field('fullName', t('fullName'), <Input {...fieldProps('fullName')} autoComplete="name" required maxLength={80} />)}
        {field(
          'phone',
          t('phone'),
          <Input
            {...fieldProps('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={20}
            placeholder={t('phonePlaceholder')}
          />,
        )}
      </div>

      {field('email', t('email'), <Input {...fieldProps('email')} type="email" autoComplete="email" maxLength={120} />, true)}

      {type === 'booking' && departures.length ? (
        field(
          'departureDate',
          t('departureDate'),
          <Select {...fieldProps('departureDate')}>
            {departures.map((departure) => (
              <option key={departure.value} value={departure.value}>
                {departure.label}
              </option>
            ))}
            <option value="">{t('otherDate')}</option>
          </Select>,
        )
      ) : null}

      <div className="grid grid-cols-2 gap-5">
        {field(
          'adults',
          t('adults'),
          <Input
            {...fieldProps('adults')}
            defaultValue={values.adults ?? (type === 'booking' ? '2' : undefined)}
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
          />,
        )}
        {field(
          'children',
          t('children'),
          <Input {...fieldProps('children')} type="number" inputMode="numeric" min={0} max={99} />,
        )}
      </div>

      {field(
        'message',
        t('message'),
        <Textarea
          {...fieldProps('message')}
          maxLength={2000}
          placeholder={type === 'booking' ? t('messagePlaceholderBooking') : t('messagePlaceholderConsultation')}
        />,
        true,
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-body">{t('privacy')}</p>
        <Button type="submit" disabled={pending} aria-disabled={pending} className="sm:min-w-44">
          {pending ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  )
}
