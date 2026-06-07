'use client';
import React, { useEffect } from 'react';
import { buildEmbedUrl, VideoPlatform } from './videoUtils';

type IVideoOverlay = {
  isOpen: boolean;
  onClose: () => void;
  platform: VideoPlatform;
  videoId: string;
};

const VideoOverlay = ({ isOpen, onClose, platform, videoId }: IVideoOverlay) => {
  useEffect(() => {
    if (isOpen) {
      // Save current overflow style
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const embedUrl = buildEmbedUrl(platform, videoId);

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
      className='fixed inset-0 z-backdrop bg-black/70 flex justify-center items-center cursor-pointer'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='relative w-full aspect-video z-overlay m-[5%] pointer-events-auto'
      >
        <iframe
          className='w-full h-full rounded-lg'
          src={embedUrl}
          title={platform === 'youtube' ? 'YouTube video' : 'Vimeo video'}
          allow={
            platform === 'youtube'
              ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
              : 'autoplay; fullscreen; picture-in-picture'
          }
          allowFullScreen
        />
      </div>
      <button
        onClick={onClose}
        className='absolute top-2 right-2 text-white text-b-28 p-2 cursor-pointer'
      >
        ✕
      </button>
    </div>
  );
};

export default VideoOverlay;
