'use client';
import React, { useEffect, useState } from 'react';
import { MenuButton } from '../MenuButton/MenuButton';
import { motion, AnimatePresence, easeInOut } from 'framer-motion';
import { Link } from 'next-view-transitions';
import { useRouter } from 'next/navigation';
import SocialIcons from '@/components/Icons/SocialIcons';
import HeaderLogo from '../HeaderLogo';
import { useMobileHeaderHeight } from './useMobileHeaderHeight';
import type { FetchHeaderResult } from '../../../../sanity.types';

const overlayVariants = {
  open: { opacity: 0.4, transition: { duration: 0.12, ease: easeInOut } },
  closed: { opacity: 0, transition: { duration: 0.12, ease: easeInOut } },
};

const menuVariants = {
  open: { height: 'auto', opacity: 1 },
  closed: { height: 0, opacity: 0 },
};

type IMobileMenuBar = {
  header: FetchHeaderResult;
};

const MobileMenuBar: React.FC<IMobileMenuBar> = ({ header }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const headerRef = useMobileHeaderHeight();

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

  if (!header) return null;

  const { linkReference, socialMediaLinks, homeMenuItemLabel } = header;

  const handleLinkClick = (href: string, isExternal: boolean = false) => {
    setIsOpen(false);

    setTimeout(() => {
      if (isExternal) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        router.push(href);
      }
    }, 60);
  };

  return (
    <div className='flex flex-col items-center fixed top-5 w-full lg:hidden'>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className='fixed inset-0 z-[100] h-full w-full bg-black'
            variants={overlayVariants}
            initial='closed'
            animate='open'
            exit='closed'
            aria-hidden={!isOpen}
            onClick={() => setIsOpen(false)}
            style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
          />
        )}
      </AnimatePresence>
      <div
        className='flex flex-col bg-white text-black justify-between w-full max-w-[35.2rem] z-[101] rounded-[3px] lg:hidden'
        role='dialog'
        aria-modal='true'
        tabIndex={-1}
      >
        <div
          ref={headerRef}
          className='flex w-full items-center justify-between px-4 py-2.5 gap-4'
        >
          <motion.div
            className='flex items-center gap-4 max-w-7 h-auto'
            animate={isOpen ? { x: 9.6, y: 9.6 } : { x: 0, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          >
            <div className='aspect-4/5 h-full w-auto'>
              <HeaderLogo header={header} variant='mobile' />
            </div>
          </motion.div>
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className='flex flex-1 items-center justify-end cursor-pointer'
            animate={isOpen ? { x: -9.6, y: 9.6 } : { x: 0, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            <MenuButton color='var(--color-black)' isOpen={isOpen} />
          </motion.button>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              key='menu'
              variants={menuVariants}
              initial='closed'
              animate='open'
              exit='closed'
              transition={{ duration: 0.15, ease: 'easeIn' }}
              style={{ originY: 0, willChange: 'height, opacity' }}
              className='flex flex-col items-start text-b-21 w-full max-w-[35.2rem] bg-white text-black p-6 overflow-hidden gap-3 rounded-bl-[3px] rounded-br-[3px]'
            >
              <li className='pt-3 border-t border-black/40 w-full'>
                <button
                  onClick={() => handleLinkClick('/')}
                  className='flex text-left w-full'
                >
                  {homeMenuItemLabel ? homeMenuItemLabel : 'Home'}
                </button>
              </li>

              {linkReference?.map((link) => {
                const isExternal = link.link?.linkType === 'externalLink';
                const isInternal = link.link?.linkType === 'internalLink';

                if (isExternal) {
                  return (
                    <li
                      key={link._key}
                      className='pt-3 border-t border-black/40 w-full'
                    >
                      <button
                        onClick={() =>
                          handleLinkClick(link.link?.externalLink || '', true)
                        }
                        className='flex text-left w-full'
                      >
                        {link.label}
                      </button>
                    </li>
                  );
                } else if (isInternal) {
                  return (
                    <li
                      key={link._key}
                      className='pt-3 border-t border-black/40 w-full'
                    >
                      <button
                        onClick={() =>
                          handleLinkClick(
                            `/${link.link?.internalLink?.slug?.current || ''}`
                          )
                        }
                        className='flex text-left w-full'
                      >
                        {link.link?.internalLink?.pageTitle || link.label}
                      </button>
                    </li>
                  );
                }
                return null;
              })}

              {/* Social Media Links at bottom */}
              <li className='pt-3 border-t border-black/40 w-full'>
                <div className='flex justify-end gap-4'>
                  {socialMediaLinks?.map((link) => (
                    <Link
                      key={link._key}
                      href={link.externalLink || ''}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <SocialIcons
                        href={link.externalLink ?? undefined}
                        color='var(--color-black)'
                      />
                    </Link>
                  ))}
                </div>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileMenuBar;
