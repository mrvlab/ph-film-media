import Header from '@/components/Header/Header';
import { Link } from 'next-view-transitions';

export default function Custom404() {
  return (
    <>
      <Header />
      <main
        className='grid lg:col-span-10 lg:row-span-full lg:overflow-y-scroll lg:py-p-desktop'
        id='not-found-main'
      >
        <div className='flex h-screen flex-col items-center justify-center gap-12 lg:h-full lg:gap-16'>
          <h2 className='text-[21.3rem] lg:text-[37.8rem] leading-[0.9] text-white/90'>
            404
          </h2>

          <Link href='/' className='primary-button'>
            Navigera Hem
          </Link>
        </div>
      </main>
    </>
  );
}
