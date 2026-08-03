import { useCallback, useEffect, useState } from 'react';
import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle';
import {
  useClient,
  useDocumentOperation,
  type DocumentActionComponent,
  type DocumentActionProps,
} from 'sanity';

import { apiVersion } from '../env';
import { settingsQuery } from '../lib/queries';
import {
  DEFAULT_MEMBERSHIP_CURRENCY,
  DEFAULT_MEMBERSHIP_FEE,
} from '@/lib/members/membershipFee';

/**
 * "Mark as existing member" — a one-time document action for grandfathering in
 * members who joined before online payments existed. It fills the payment
 * fields exactly as a completed current-flow purchase would (see
 * registerMemberFromSession): the current membership fee from Settings,
 * activates the member, then publishes.
 *
 * Applied at most once: it stamps `paymentBypassedAt`, which disables the action
 * afterwards. It's also disabled for members who already have a real Stripe
 * payment on record, or who are missing the required first name / email.
 */
export const MarkExistingMemberAction: DocumentActionComponent = (
  props: DocumentActionProps,
) => {
  const { id, type, draft, published, onComplete } = props;
  const client = useClient({ apiVersion });
  const { patch, publish } = useDocumentOperation(id, type);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const doc = draft ?? published;
  const alreadyBypassed = Boolean(doc?.paymentBypassedAt);
  const alreadyPaid = Boolean(doc?.stripeSessionId) || doc?.amount != null;
  const missingRequired = !doc?.email || !doc?.firstName;

  // After publish completes the draft is folded into the published document, so
  // wait for `draft` to clear before closing the action.
  useEffect(() => {
    if (isActivating && !draft) {
      setIsActivating(false);
      onComplete();
    }
  }, [isActivating, draft, onComplete]);

  const handleConfirm = useCallback(async () => {
    // Same source of truth as the live Stripe charge and the signup modal.
    const settings = await client.fetch(settingsQuery);
    const fee = settings?.membership?.fee ?? DEFAULT_MEMBERSHIP_FEE;
    const currency = (
      settings?.membership?.currency ?? DEFAULT_MEMBERSHIP_CURRENCY
    ).toLowerCase();
    const now = new Date().toISOString();

    // Mirrors registerMemberFromSession, minus the Stripe IDs — `paymentBypassedAt`
    // is the audit marker in their place.
    patch.execute([
      {
        set: {
          amount: fee,
          currency,
          paidAt: now,
          status: 'active',
          paymentBypassedAt: now,
        },
      },
      { setIfMissing: { joinedAt: now, newsletterConsent: true } },
    ]);
    publish.execute();
    setDialogOpen(false);
    setIsActivating(true);
  }, [client, patch, publish]);

  if (type !== 'member') return null;

  const disabledReason = alreadyBypassed
    ? 'This member was already marked as an existing member.'
    : alreadyPaid
      ? 'This member already has a recorded payment.'
      : missingRequired
        ? 'Add a first name and email before activating.'
        : null;

  return {
    label: isActivating ? 'Activating…' : 'Mark as existing member',
    icon: CheckmarkCircleIcon,
    tone: 'positive',
    disabled: isActivating || disabledReason !== null,
    title: disabledReason ?? undefined,
    onHandle: () => setDialogOpen(true),
    dialog: dialogOpen && {
      type: 'confirm',
      tone: 'positive',
      message:
        'Mark this person as an existing member (joined before online payments)? ' +
        'This records the current membership fee, activates them, and publishes. ' +
        'It can only be done once.',
      onCancel: () => setDialogOpen(false),
      onConfirm: handleConfirm,
    },
  };
};
