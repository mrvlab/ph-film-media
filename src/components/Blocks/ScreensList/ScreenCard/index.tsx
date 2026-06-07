'use client';

import React, { useState } from 'react';
import SanityImage from '@/components/Media/SanityImage';
import ResolvedLink from '@/components/ResolvedLink';
import VideoOverlay from '@/components/VideoOverlay/VideoOverlay';
import { extractVideoInfo } from '@/components/VideoOverlay/videoUtils';
import type { LinkType } from '../../../../../sanity.types';
import type { SanityImageObject } from '@/components/Media/SanityImage/SanityImageObject';
import { IScreensListBlocks } from '..';

type ScreenCardProps = {
  screen: NonNullable<NonNullable<IScreensListBlocks['screens']>[number]>;
};

const cardClassName =
  'flex flex-col gap-6 h-full hover:opacity-80 transition-opacity';

const ScreenCard = ({ screen }: ScreenCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!screen || !('_id' in screen)) return null;

  const { title, screenImage, link } = screen;
  const { platform, id: videoId } = extractVideoInfo(link?.externalLink ?? '');

  const cardContent = (
    <>
      {screenImage && (
        <SanityImage
          {...(screenImage as unknown as SanityImageObject)}
          aspectRatio='16/9'
          className='rounded-lg'
        />
      )}
      {title && <h3 className='text-b-21 font-bold'>{title}</h3>}
    </>
  );

  // YouTube / Vimeo links open the in-page video overlay.
  if (platform && videoId) {
    return (
      <div data-sanity-edit-target>
        <button
          type='button'
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
          className={`${cardClassName} cursor-pointer text-left w-full`}
        >
          {cardContent}
        </button>
        <VideoOverlay
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          platform={platform}
          videoId={videoId}
        />
      </div>
    );
  }

  // Any other link: external opens in a new tab, internal navigates (handled by ResolvedLink).
  if (link) {
    return (
      <div data-sanity-edit-target>
        <ResolvedLink
          link={link as unknown as LinkType}
          className={cardClassName}
        >
          {cardContent}
        </ResolvedLink>
      </div>
    );
  }

  return (
    <div data-sanity-edit-target className={cardClassName}>
      {cardContent}
    </div>
  );
};

export default ScreenCard;
