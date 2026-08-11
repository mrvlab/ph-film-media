'use client';
import React, { useState } from 'react';
import { TrailerType } from '../../../sanity.types';
import VideoOverlay from '../VideoOverlay/VideoOverlay';
import { extractVideoInfo } from '../VideoOverlay/videoUtils';
import { trackEvent } from '@/lib/analytics/gtag';

type ITrailerOverlay = {
  trailer: TrailerType;
  triggerIcon?: React.ReactNode;
};

const TrailerOverlay = ({ trailer, triggerIcon }: ITrailerOverlay) => {
  const [isOpen, setIsOpen] = useState(false);
  const { platform, id: videoId } = extractVideoInfo(
    trailer.trailerLink?.externalLink ?? ''
  );

  const openOverlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Playback itself is measured by GA4 for YouTube embeds; this covers the
    // open (and is the only signal for Vimeo, which GA4 can't instrument).
    trackEvent('trailer_open', {
      video_platform: platform,
      video_id: videoId,
      video_title: trailer.trailerLinkLabel ?? undefined,
    });
    setIsOpen(true);
  };
  const closeOverlay = () => setIsOpen(false);

  if (!videoId || !platform) {
    return <p>Invalid YouTube or Vimeo URL</p>;
  }

  return (
    <div>
      <button
        onClick={openOverlay}
        className='text-b-16 text-white underline underline-offset-4 cursor-pointer'
        style={{ textDecorationThickness: '1.2px' }}
      >
        {triggerIcon ? triggerIcon : (trailer.trailerLinkLabel ?? 'Trailer')}
      </button>

      <VideoOverlay
        isOpen={isOpen}
        onClose={closeOverlay}
        platform={platform}
        videoId={videoId}
      />
    </div>
  );
};

export default TrailerOverlay;
