import type { DocumentActionComponent, SanityDocument } from 'sanity';

// Disables an action (e.g. delete, unpublish) on documents that are kept as
// history, such as past season access codes and past screenings.
export function lockAction(
  action: DocumentActionComponent,
  isLocked: (doc: SanityDocument | null) => boolean,
  reason: string,
): DocumentActionComponent {
  const Locked: DocumentActionComponent = (props) => {
    const result = action(props);
    if (!result || !isLocked(props.published ?? props.draft)) return result;
    return { ...result, disabled: true, title: reason };
  };
  Locked.action = action.action;
  return Locked;
}
