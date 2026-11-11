import { Badge, Box, Card, Flex, Stack, Text } from '@sanity/ui';
import { useFormValue, type NumberInputProps } from 'sanity';

import { formatDay } from '@/lib/tickets/formatScreening';
import { isPastScreening } from '@/lib/tickets/isPastScreening';
import { seatStats, type SeatChange } from '@/lib/tickets/seatStats';

type Tone = 'positive' | 'caution' | 'critical' | 'neutral';

const BAR_COLORS: Record<Tone, string> = {
  positive: '#3ab667',
  caution: '#f0a43a',
  critical: '#e5484d',
  neutral: '#9aa0a6',
};

// The ticket's seat total, with sales above it: how many are sold, when it
// sold out, and every change of the total. Sales come from Stripe, so only the
// total is editable.
export function SeatsInput(props: NumberInputProps) {
  const date = useFormValue(['date']) as string | undefined;
  const seatsSold = useFormValue(['seatsSold']) as number | undefined;
  const soldOutAt = useFormValue(['soldOutAt']) as string | undefined;
  const seatChanges = useFormValue(['seatChanges']) as SeatChange[] | undefined;
  const stats = seatStats({
    totalSeats: props.value,
    seatsSold,
    soldOutAt,
    seatChanges,
  });
  const past = isPastScreening({ date });

  // Sold out stays red after the screening, so the sell-out is never lost.
  const tone: Tone = stats.soldOut
    ? 'critical'
    : past
      ? 'neutral'
      : stats.nearlyFull
        ? 'caution'
        : 'positive';
  // A past screening keeps its sold-out badge, so its history reads at a glance.
  const badges: { label: string; tone: Tone }[] = [];
  if (past) badges.push({ label: 'Past', tone: 'neutral' });
  if (stats.soldOut) badges.push({ label: 'Sold out', tone: 'critical' });
  else if (!past && stats.nearlyFull) badges.push({ label: 'Nearly full', tone: 'caution' });
  else if (!past) badges.push({ label: 'On sale', tone: 'positive' });
  const share = stats.total ? Math.min(stats.sold / stats.total, 1) : 0;

  return (
    <Stack gap={3}>
      <Card padding={3} radius={2} tone={tone} border>
        <Stack gap={3}>
          <Flex align="center" justify="space-between" gap={2}>
            <Text size={2} weight="semibold">
              {stats.sold} / {stats.total || '?'} sold
            </Text>
            <Flex gap={2}>
              {badges.map((badge) => (
                <Badge key={badge.label} tone={badge.tone} fontSize={1}>
                  {badge.label}
                </Badge>
              ))}
            </Flex>
          </Flex>
          <Box
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--card-border-color)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${share * 100}%`,
                height: '100%',
                background: BAR_COLORS[tone],
              }}
            />
          </Box>
          {soldOutAt && (
            <Text size={1} muted>
              Sold out {formatDay(soldOutAt)}
              {seatChanges?.length ? ` at ${stats.soldOutSeats} seats` : ''}
            </Text>
          )}
          {(seatChanges ?? []).map((change, index) => (
            <Text key={index} size={1} muted>
              {changeLine(change)}
            </Text>
          ))}
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
}

function changeLine(change: SeatChange): string {
  const verb = change.to > change.from ? 'Raised' : 'Lowered';
  return `${verb} ${change.from} → ${change.to} on ${formatDay(change.changedAt)}`;
}
