'use client';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, easeOut, easeInOut } from 'framer-motion';
import { buildEmbedUrl, VideoPlatform } from './videoUtils';

type IVideoOverlay = {
  isOpen: boolean;
  onClose: () => void;
  platform: VideoPlatform;
  videoId: string;
};

// Enter: the lights dim (backdrop) and the curtains widen (panel) in sync, and
// only once the film is ready to roll (iframe loaded).
const CURTAIN = { duration: 0.5, ease: easeOut };
// Leave: matches the sign-up modal — a quick fade + small slide, no zoom-out.
const EXIT = { duration: 0.18, ease: easeInOut };

const VideoOverlay = ({
  isOpen,
  onClose,
  platform,
  videoId,
}: IVideoOverlay) => {
  const [loaded, setLoaded] = useState(false);

  // Reset the ready gate whenever a new video opens. Deferred to a frame so the
  // state update isn't synchronous inside the effect body (set-state-in-effect).
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => setLoaded(false));
    return () => cancelAnimationFrame(frame);
  }, [isOpen, videoId]);

  // Lock body scroll and wire Escape-to-close while open.
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  const embedUrl = buildEmbedUrl(platform, videoId);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key='video-overlay'
          role='dialog'
          aria-modal='true'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          initial={{
            backgroundColor: 'rgba(0,0,0,0)',
            backdropFilter: 'blur(0px)',
          }}
          animate={{
            backgroundColor: loaded ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)',
            backdropFilter: loaded ? 'blur(var(--backdrop-blur))' : 'blur(0px)',
          }}
          exit={{
            backgroundColor: 'rgba(0,0,0,0)',
            backdropFilter: 'blur(0px)',
            transition: EXIT,
          }}
          transition={CURTAIN}
          className='fixed inset-0 z-backdrop flex justify-center items-center cursor-pointer'
        >
          {!loaded ? (
            <span
              aria-hidden='true'
              className='absolute size-10 animate-spin rounded-full border-2 border-white/60 border-t-transparent'
            />
          ) : null}

          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
            }
            exit={{ opacity: 0, y: 12, scale: 0.98, transition: EXIT }}
            transition={CURTAIN}
            className='relative w-full aspect-video z-overlay m-[5%] pointer-events-auto'
          >
            <iframe
              className='w-full h-full rounded-lg'
              src={embedUrl}
              onLoad={() => setLoaded(true)}
              title={platform === 'youtube' ? 'YouTube video' : 'Vimeo video'}
              allow={
                platform === 'youtube'
                  ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                  : 'autoplay; fullscreen; picture-in-picture'
              }
              allowFullScreen
            />
          </motion.div>
          <button
            onClick={onClose}
            aria-label='Stäng'
            className='absolute top-2 right-2 text-white text-b-28 p-2 cursor-pointer'
          >
            ✕
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default VideoOverlay;
