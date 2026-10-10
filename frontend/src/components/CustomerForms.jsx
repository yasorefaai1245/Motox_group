import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api.js'

function useDialog(open, onClose) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()

    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [open, onClose])

  return dialogRef
}

function apiErrorMessage(error, fallback) {
  const validationErrors = error.response?.data?.errors
  if (validationErrors) return Object.values(validationErrors).flat().join(' ')
  return error.response?.data?.message || fallback
}

function CustomerDialog({ title, eyebrow, onClose, children }) {
  const dialogRef = useDialog(true, onClose)

  return (
    <dialog
      className="customer-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="dialog-heading">
        <div>
          <p className="eyebrow eyebrow-dark">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Close form">
          ×
        </button>
      </div>
      {children}
    </dialog>
  )
}

export function MotorcycleEnquiryDialog({
  motorcycles,
  selectedMotorcycle = '',
  onClose,
}) {
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return

    setSubmitting(true)
    setFeedback({ type: '', message: '' })
    const fields = new FormData(form)
    const motorcycleId = fields.get('motorcycle_id')
    const payload = {
      customer_name: fields.get('customer_name').trim(),
      customer_email: fields.get('customer_email').trim(),
      customer_phone: fields.get('customer_phone').trim(),
      message: fields.get('message').trim(),
      ...(motorcycleId ? { motorcycle_id: Number(motorcycleId) } : {}),
      ...(fields.get('type').trim() ? { type: fields.get('type').trim() } : {}),
    }

    try {
      await api.post('/api/enquiries', payload)
      setFeedback({
        type: 'success',
        message: 'Your enquiry was sent. Our team will be in touch.',
      })
      form.reset()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: apiErrorMessage(error, 'Your enquiry could not be sent. Please try again.'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CustomerDialog
      title="Talk to our team."
      eyebrow="Motorcycle enquiry"
      onClose={onClose}
    >
      <form className="customer-form" onSubmit={handleSubmit}>
        <label>
          Your name
          <input name="customer_name" autoComplete="name" maxLength="255" required />
        </label>
        <label>
          Email address
          <input name="customer_email" type="email" autoComplete="email" maxLength="255" required />
        </label>
        <label>
          Phone number
          <input name="customer_phone" type="tel" autoComplete="tel" maxLength="50" required />
        </label>
        <label>
          Motorcycle <span className="optional-label">(optional)</span>
          <select name="motorcycle_id" defaultValue={selectedMotorcycle}>
            <option value="">General enquiry</option>
            {motorcycles.map((motorcycle) => (
              <option value={motorcycle.id} key={motorcycle.id}>{motorcycle.name}</option>
            ))}
          </select>
        </label>
        <label>
          Enquiry type <span className="optional-label">(optional)</span>
          <input name="type" maxLength="50" placeholder="Model information, service…" />
        </label>
        <label className="form-full">
          Message
          <textarea name="message" rows="4" required />
        </label>
        {feedback.message && (
          <p
            className={`form-feedback form-full ${feedback.type}`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            {feedback.message}
          </p>
        )}
        <button className="button button-copper form-full" type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send enquiry'}
          {!submitting && <span aria-hidden="true">↗</span>}
        </button>
      </form>
    </CustomerDialog>
  )
}

function localDateString(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function TestRideDialog({
  motorcycles,
  showrooms,
  selectedMotorcycle = '',
  onClose,
  loading = false,
  error = '',
}) {
  const [motorcycleId, setMotorcycleId] = useState(selectedMotorcycle)
  const [showroomId, setShowroomId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const selected = motorcycles.find(
    (motorcycle) => String(motorcycle.id) === String(motorcycleId),
  )
  const availableShowrooms = useMemo(() => {
    if (!selected) return []
    return showrooms.filter((showroom) =>
      showroom.brands?.some(
        (brand) => String(brand.id) === String(selected.brand?.id ?? selected.brand_id),
      ),
    )
  }, [selected, showrooms])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return

    setSubmitting(true)
    setFeedback({ type: '', message: '' })
    const fields = new FormData(form)
    const payload = {
      motorcycle_id: Number(fields.get('motorcycle_id')),
      showroom_id: Number(fields.get('showroom_id')),
      customer_name: fields.get('customer_name').trim(),
      customer_email: fields.get('customer_email').trim(),
      customer_phone: fields.get('customer_phone').trim(),
      ride_date: fields.get('ride_date'),
      ride_time: fields.get('ride_time'),
      notes: fields.get('notes').trim(),
    }

    try {
      await api.post('/api/test-rides', payload)
      setFeedback({
        type: 'success',
        message: 'Your test ride request was received. The showroom will contact you to confirm.',
      })
      form.reset()
      setMotorcycleId('')
      setShowroomId('')
    } catch (error) {
      setFeedback({
        type: 'error',
        message: apiErrorMessage(error, 'Your test ride request could not be sent. Please try again.'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || error || !motorcycles.length || !showrooms.length) {
    return (
      <CustomerDialog
        title="A ride is just ahead."
        eyebrow="Test ride request"
        onClose={onClose}
      >
        <p className={`resource-message${error ? ' resource-error' : ''}`} role={loading || error ? 'status' : undefined}>
          {loading
            ? 'Loading available motorcycles and showrooms…'
            : error
              ? `Booking options couldn’t be loaded. ${error}`
              : !motorcycles.length
                ? 'Test rides are unavailable because no active motorcycles are listed.'
                : 'Test rides are unavailable because no active showrooms are configured.'}
        </p>
      </CustomerDialog>
    )
  }

  return (
    <CustomerDialog
      title="Your next ride starts here."
      eyebrow="Request a test ride"
      onClose={onClose}
    >
      <p className="dialog-note">
        Your request is not a confirmed booking. The showroom will contact you to confirm.
      </p>
      <form className="customer-form" onSubmit={handleSubmit}>
        <label className="form-full">
          Motorcycle
          <select
            name="motorcycle_id"
            value={motorcycleId}
            onChange={(event) => {
              setMotorcycleId(event.target.value)
              setShowroomId('')
            }}
            required
          >
            <option value="" disabled>Select a motorcycle</option>
            {motorcycles.map((motorcycle) => (
              <option value={motorcycle.id} key={motorcycle.id}>{motorcycle.name}</option>
            ))}
          </select>
        </label>
        <label className="form-full">
          Showroom
          <select
            name="showroom_id"
            value={showroomId}
            onChange={(event) => setShowroomId(event.target.value)}
            required
            disabled={!motorcycleId || !availableShowrooms.length}
          >
            <option value="" disabled>
              {motorcycleId ? 'Select a showroom' : 'Choose a motorcycle first'}
            </option>
            {availableShowrooms.map((showroom) => (
              <option value={showroom.id} key={showroom.id}>
                {[showroom.city, showroom.type].filter(Boolean).join(' — ')
                  || `MotoX location ${showroom.id}`}
              </option>
            ))}
          </select>
        </label>
        {motorcycleId && !availableShowrooms.length && (
          <p className="resource-message form-full" role="status">
            No active showroom is configured for this motorcycle’s brand.
          </p>
        )}
        <label>
          Your name
          <input name="customer_name" autoComplete="name" maxLength="255" required />
        </label>
        <label>
          Email address
          <input name="customer_email" type="email" autoComplete="email" maxLength="255" required />
        </label>
        <label>
          Phone number
          <input name="customer_phone" type="tel" autoComplete="tel" maxLength="50" required />
        </label>
        <div className="form-pair">
          <label>
            Preferred date
            <input name="ride_date" type="date" min={localDateString(new Date())} required />
          </label>
          <label>
            Preferred time
            <input name="ride_time" type="time" required />
          </label>
        </div>
        <label className="form-full">
          Notes <span className="optional-label">(optional)</span>
          <textarea name="notes" rows="3" />
        </label>
        {feedback.message && (
          <p
            className={`form-feedback form-full ${feedback.type}`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            {feedback.message}
          </p>
        )}
        <button
          className="button button-copper form-full"
          type="submit"
          disabled={submitting || !motorcycleId || !showroomId || !availableShowrooms.length}
        >
          {submitting ? 'Sending request…' : 'Request a test ride'}
          {!submitting && <span aria-hidden="true">↗</span>}
        </button>
      </form>
    </CustomerDialog>
  )
}
