'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, easeInOut } from 'framer-motion';

import { useMembershipGate } from './useMembershipGate';

type GateView = 'choice' | 'join' | 'code' | 'joined' | 'disabled';

type TicketGateModalProps = {
  ticketId: string;
  // Footer contact email, shown when a member's access has been revoked.
  contactEmail?: string | null;
  // Membership fee label (e.g. "49 kr") from Settings, shown on the join step.
  membershipFeeLabel?: string;
  // Step to open on (default "choice"); "joined" when returning from Stripe.
  initialView?: GateView;
  // Prefills the code step's email after a member returns from joining.
  initialEmail?: string;
  onClose: () => void;
};

const CONSENT_TEXT =
  'Genom att skicka in formuläret godkänner jag att ta emot nyhetsbrev och erbjudanden via e-post';

// Fallback if Settings hasn't loaded a fee label for some reason.
const DEFAULT_FEE_LABEL = '49 kr';

const inputCls =
  'w-full border-b border-black/40 bg-transparent pb-3 text-b-21 text-black placeholder:text-black/60 focus:border-black focus:outline-none';
const primaryBtn =
  'flex w-full items-center justify-center rounded-lg bg-black py-4 text-b-16 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:text-b-21';
const secondaryBtn =
  'flex w-full items-center justify-center rounded-lg border border-black/40 py-4 text-b-16 text-black transition-colors hover:border-black hover:bg-black/5 lg:text-b-21';

function Spinner() {
  return (
    <span
      aria-hidden='true'
      className='size-5 animate-spin rounded-full border-2 border-white border-t-transparent'
    />
  );
}

export function TicketGateModal({
  ticketId,
  contactEmail,
  membershipFeeLabel,
  initialView = 'choice',
  initialEmail = '',
  onClose,
}: TicketGateModalProps) {
  const [view, setView] = useState<GateView>(initialView);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const { loading, error, setError, checkOrJoin, buyTicket } =
    useMembershipGate(ticketId);

  // Lock body scroll and wire Escape-to-close while mounted (i.e. open).
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  // Switch step and clear any stale error from the previous step.
  function goTo(next: GateView) {
    setError(null);
    setView(next);
  }

  async function handleJoinSubmit(e: FormEvent) {
    e.preventDefault();
    const outcome = await checkOrJoin(firstName, lastName, email);
    if (outcome === 'is_member') goTo('code');
    else if (outcome === 'disabled') goTo('disabled');
    // 'redirecting' → navigating to Stripe; null → error already shown.
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    const errorCode = await buyTicket(email, code);
    if (errorCode === 'membership_disabled') goTo('disabled');
    // null → redirecting to Stripe; 'not_member'/'invalid_code' → inline error.
  }

  const feeLabel = membershipFeeLabel || DEFAULT_FEE_LABEL;

  const heading =
    view === 'choice'
      ? 'Endast för medlemmar'
      : view === 'join'
        ? 'Bli medlem'
        : view === 'code'
          ? 'Lös in din kod'
          : view === 'joined'
            ? 'Välkommen!'
            : 'Något gick fel';

  const joinDisabled =
    loading || firstName.trim() === '' || email.trim() === '';
  const codeDisabled = loading || email.trim() === '' || code.trim() === '';

  return createPortal(
    <motion.div
      key='ticket-gate'
      role='dialog'
      aria-modal='true'
      aria-label={heading}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className='fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 backdrop-blur-[var(--backdrop-blur)] px-p-mobile lg:px-p-desktop'
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.18, ease: easeInOut }}
        className='relative w-full max-w-[64rem] rounded-lg bg-white p-p-mobile md:p-p-desktop text-black '
      >
        <button
          type='button'
          onClick={onClose}
          aria-label='Stäng'
          className='absolute right-6 top-6 text-h-28 leading-none text-black/80 transition-opacity hover:opacity-60 lg:right-8 lg:top-8'
        >
          ✕
        </button>

        {/* Keyed so each step animates in on change (fade + small slide). */}
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.16, ease: easeInOut }}
        >
          <h2 className='pr-10 text-h-37 uppercase leading-[1.05]'>
            {heading}
          </h2>

          {view === 'choice' ? (
            <>
              <p className='mt-5 text-b-16 leading-snug text-black/80 lg:text-b-21'>
                Biljetter är exklusiva för medlemmar i Filmklubben. Som medlem
                får du tillgång till exklusiva visningar.
              </p>
              <div className='mt-8 flex flex-col gap-3'>
                <button
                  type='button'
                  onClick={() => goTo('join')}
                  className={primaryBtn}
                >
                  Bli medlem ({feeLabel})
                </button>
                <button
                  type='button'
                  onClick={() => goTo('code')}
                  className={secondaryBtn}
                >
                  Jag är redan medlem
                </button>
              </div>
            </>
          ) : null}

          {view === 'join' ? (
            <>
              <p className='mt-5 text-b-16 leading-snug text-black/80 lg:text-b-21'>
                Fyll i dina uppgifter för att bli medlem i Filmklubben. Koden
                till visningen skickas till din mejl.
              </p>
              <form onSubmit={handleJoinSubmit} className='mt-8'>
                <div className='flex flex-col gap-6'>
                  <div className='flex flex-col gap-6 sm:flex-row sm:gap-4'>
                    <input
                      type='text'
                      autoComplete='given-name'
                      autoFocus
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder='Förnamn'
                      className={inputCls}
                    />
                    <input
                      type='text'
                      autoComplete='family-name'
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder='Efternamn'
                      className={inputCls}
                    />
                  </div>
                  <input
                    type='email'
                    inputMode='email'
                    autoComplete='email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Ange din e-postadress'
                    className={inputCls}
                  />
                </div>
                <button
                  type='submit'
                  disabled={joinDisabled}
                  className={`mt-6 ${primaryBtn}`}
                >
                  {loading ? <Spinner /> : `Bli medlem (${feeLabel})`}
                </button>
                {error ? (
                  <p className='mt-4 text-b-14 text-red-700'>{error}</p>
                ) : null}
              </form>
              <p className='mt-6 text-b-12 leading-snug text-black/60'>
                {CONSENT_TEXT}
              </p>
            </>
          ) : null}

          {view === 'code' ? (
            <>
              <p className='mt-5 text-b-16 leading-snug text-black/80 lg:text-b-21'>
                Ange din e-post och koden för visningen för att köpa din
                biljett.
              </p>
              <form onSubmit={handleCodeSubmit} className='mt-8'>
                <div className='flex flex-col gap-6'>
                  <input
                    type='email'
                    inputMode='email'
                    autoComplete='email'
                    autoFocus={email.trim() === ''}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Ange din e-postadress'
                    className={inputCls}
                  />
                  <input
                    type='text'
                    autoComplete='off'
                    autoCapitalize='characters'
                    autoFocus={email.trim() !== ''}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder='Ange din kod'
                    className={inputCls}
                  />
                </div>
                <button
                  type='submit'
                  disabled={codeDisabled}
                  className={`mt-6 ${primaryBtn}`}
                >
                  {loading ? <Spinner /> : 'Köp biljett'}
                </button>
                {error ? (
                  <p className='mt-4 text-b-14 text-red-700'>{error}</p>
                ) : null}
              </form>
              <button
                type='button'
                onClick={() => goTo('join')}
                className='mt-5 text-b-14 text-black/70 underline underline-offset-2 hover:text-black'
              >
                Inte medlem än? Bli medlem
              </button>
            </>
          ) : null}

          {view === 'joined' ? (
            <>
              <p className='mt-5 text-b-16 leading-snug text-black/80 lg:text-b-21'>
                Du är nu medlem i Filmklubben. Håll utkik i din e-post — koden
                till visningen skickas via vårt nyhetsbrev. Har du redan koden
                kan du lösa in den nedan.
              </p>
              <div className='mt-8 flex flex-col gap-3'>
                <button
                  type='button'
                  onClick={() => goTo('code')}
                  className={primaryBtn}
                >
                  Lös in din kod
                </button>
                <button
                  type='button'
                  onClick={onClose}
                  className={secondaryBtn}
                >
                  Stäng
                </button>
              </div>
            </>
          ) : null}

          {view === 'disabled' ? (
            <p className='mt-5 text-b-16 leading-snug text-black/80 lg:text-b-21'>
              {contactEmail ? (
                <>
                  Hör av dig till mig på{' '}
                  <a
                    href={`mailto:${contactEmail}`}
                    className='underline underline-offset-2 hover:opacity-70'
                  >
                    {contactEmail}
                  </a>{' '}
                  vid problem. Eller försök igen om en liten stund.
                </>
              ) : (
                'Hör av dig till oss vid problem. Eller försök igen om en liten stund.'
              )}
            </p>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
