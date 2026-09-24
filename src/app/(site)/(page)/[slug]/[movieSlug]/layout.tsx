import '@/app/globals.css';

import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';

export default async function MoviePageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main
        className='grid grid-cols-1 lg:col-span-10 lg:row-span-full lg:overflow-y-scroll lg:py-p-desktop'
        id='movie-main-content'
      >
        {children}
        <Footer />
      </main>
    </>
  );
}
