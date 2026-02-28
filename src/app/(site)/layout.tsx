import { SanityLive } from '@/sanity/lib/live';
import { draftMode } from 'next/headers';
import { VisualEditing } from 'next-sanity/visual-editing';
import { DisableDraftMode } from '@/components/DisableDraftMode';

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isEnabled: isDraftMode } = await draftMode();
  return (
    <>
      {isDraftMode && (
        <>
          <VisualEditing />
          <DisableDraftMode />
        </>
      )}
      <SanityLive />
      {children}
    </>
  );
}
