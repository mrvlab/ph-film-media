'use client';

import React from 'react';
import { AnimatePresence, motion, easeOut, easeInOut } from 'framer-motion';
import { Link } from 'next-view-transitions';
import { usePathname } from 'next/navigation';
import { IDesktopMenuBar } from './DesktopMenuBar';
import HeaderLogo from '../HeaderLogo';
import { DesktopMenuIcon } from './DesktopMenuIcon';
import {
  getLinkHref,
  getLinkText,
  getLinkTarget,
  getLinkRel,
  isLinkActive,
} from './utils';

const ENTER = { duration: 0.35, ease: easeOut };
const EXIT = { duration: 0.18, ease: easeInOut };

const DesktopMenuBar = ({
  header,
  isOpen,
  onToggle,
  onClose,
}: IDesktopMenuBar) => {
  const pathname = usePathname();

  if (!header?.linkReference) return null;

  const { linkReference } = header;

  // On the start page, light every item up as active.
  const isHome = pathname === '/';

  return (
    // Left column: logo top, CTA bottom. @container so the CTA scales with it.
    <div className='@container hidden lg:flex lg:flex-col lg:justify-between lg:h-full'>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key='desktop-menu-backdrop'
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: EXIT }}
            transition={ENTER}
            className='fixed inset-0 z-10 bg-black/70 backdrop-blur-[var(--backdrop-blur)]'
          />
        ) : null}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key='desktop-menu-panel'
            role='dialog'
            aria-modal='true'
            aria-label='Menu'
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%', transition: EXIT }}
            transition={ENTER}
            className='fixed left-0 top-0 z-20 h-full w-full max-w-[35.2rem] bg-white text-black px-p-desktop py-p-desktop'
          >
            <ul className='group flex flex-col items-start text-h-37 font-oswald font-bold'>
              {linkReference.map((link) => {
                const isActive = isHome || isLinkActive(pathname, link);
                return (
                  <li key={link._key}>
                    <Link
                      href={getLinkHref(link)}
                      target={getLinkTarget(link)}
                      rel={getLinkRel(link)}
                      onClick={onClose}
                      className={`transition-colors duration-300 leading-[normal] hover:text-black ${
                        isActive
                          ? 'text-black group-hover:text-black/40'
                          : 'text-black/40'
                      }`}
                    >
                      {getLinkText(link)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <HeaderLogo header={header} variant='desktop' />

      {/* CTA — colour flips to stay legible on the dark site / white panel */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        className='relative z-30 flex items-center gap-[1.25em] cursor-pointer text-[clamp(1.2rem,9.6cqi,1.8rem)]'
      >
        <DesktopMenuIcon
          isOpen={isOpen}
          color={isOpen ? 'var(--color-black)' : 'var(--color-white)'}
          className='w-[4em] h-[1.75em]'
        />
        <span className={`uppercase ${isOpen ? 'text-black' : 'text-white'}`}>
          {isOpen ? 'Close' : 'Menu'}
        </span>
      </button>
    </div>
  );
};

export default DesktopMenuBar;
