import { useDocumentOperation, type DocumentActionComponent } from 'sanity';

// Wraps Publish on tickets: when the seat total differs from the published
// one, a seat change is added to the draft first, with the seats sold at that
// moment. That keeps the original capacity and shows when seats were raised
// because a screening sold out.
export function recordSeatChange(
  action: DocumentActionComponent,
): DocumentActionComponent {
  const Recording: DocumentActionComponent = (props) => {
    const result = action(props);
    const { patch } = useDocumentOperation(props.id, props.type);
    if (!result) return result;

    const from = props.published?.totalSeats;
    const to = props.draft?.totalSeats;
    if (typeof from !== 'number' || typeof to !== 'number' || from === to) {
      return result;
    }

    return {
      ...result,
      onHandle: () => {
        const sold = props.published?.seatsSold;
        patch.execute([
          { setIfMissing: { seatChanges: [] } },
          {
            insert: {
              after: 'seatChanges[-1]',
              items: [
                {
                  _key: crypto.randomUUID().slice(0, 12),
                  _type: 'seatChange',
                  from,
                  to,
                  soldAtChange: typeof sold === 'number' ? sold : 0,
                  changedAt: new Date().toISOString(),
                },
              ],
            },
          },
        ]);
        result.onHandle?.();
      },
    };
  };
  Recording.action = action.action;
  return Recording;
}
