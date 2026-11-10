import { useEffect, useState } from 'react';
import { Card, Stack, Text } from '@sanity/ui';
import { useClient, useFormValue, type ReferenceInputProps } from 'sanity';

import { apiVersion } from '../env';
import { seasonLabel, seasonOf } from '@/lib/members/seasons';

const SEASON_QUERY = `*[_type == "seasonAccessCode" && scope != "screening" && season == $season] | order(_updatedAt desc)[0].code`;
const OVERRIDE_QUERY = `*[_id == $id][0].code`;

// The ticket's access code field: shows which code applies, then the picker
// for an optional screening code. Without one, checkout uses the code for the
// season of the screening date, the same lookup as here.
export function SeasonAccessCodeInput(props: ReferenceInputProps) {
  const date = useFormValue(['date']) as string | undefined;
  const override = props.value?._ref;
  const client = useClient({ apiVersion });
  const season = date ? seasonOf(date) : null;
  // `undefined` while loading, `null` when there's no code to use.
  const [code, setCode] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!season && !override) return;
    let cancelled = false;
    client
      .fetch<string | null>(override ? OVERRIDE_QUERY : SEASON_QUERY, {
        id: override ?? '',
        season: season ?? '',
      })
      .then((result) => {
        if (!cancelled) setCode(result ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [client, season, override]);

  return (
    <Stack gap={3}>
      <Status code={code} override={!!override} season={season} />
      {props.renderDefault(props)}
      <Text size={1} muted>
        {override
          ? 'Clear the screening code to use the season code again.'
          : 'To use a different code for this screening only, pick a screening code. Create one under Members → Access codes.'}
      </Text>
    </Stack>
  );
}

function Status({
  code,
  override,
  season,
}: {
  code: string | null | undefined;
  override: boolean;
  season: string | null;
}) {
  if (!override && !season) {
    return (
      <Card padding={3} radius={2} tone="neutral" border>
        <Text size={1} muted>
          Set the screening date to see which season code applies.
        </Text>
      </Card>
    );
  }

  if (code === undefined) {
    return (
      <Card padding={3} radius={2} tone="neutral" border>
        <Text size={1} muted>
          Loading…
        </Text>
      </Card>
    );
  }

  const label = season ? `Säsong ${seasonLabel(season)}` : '';

  if (code === null) {
    return (
      <Card padding={3} radius={2} tone="caution" border>
        <Text size={1}>
          {override
            ? 'The picked screening code has no code text.'
            : `${label} has no access code yet, so tickets can’t be bought. Add one under Members → Access codes, or pick a screening code below.`}
        </Text>
      </Card>
    );
  }

  return (
    <Card padding={3} radius={2} tone={override ? 'primary' : 'positive'} border>
      <Stack gap={2}>
        <Text size={2} weight="semibold">
          {code}
        </Text>
        <Text size={1} muted>
          {override ? 'Screening code for this ticket only.' : `Season code for ${label}.`}
        </Text>
      </Stack>
    </Card>
  );
}
