import '@/app/globals.css';

import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { fetchFooter } from '@/sanity/lib/queries';
import { sanityFetch } from '@/sanity/lib/live';
import type { FetchFooterResult } from '../../../../../../sanity.types';

export default async function MoviePageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: footer }: { data: FetchFooterResult } = await sanityFetch({
    query: fetchFooter,
  });

  return (
    <>
      <Header />
      <main
        className='grid grid-cols-1 lg:col-span-10 lg:row-span-full lg:overflow-y-scroll lg:py-p-desktop'
        id='movie-main-content'
      >
        {children}
        <Footer footer={footer} />
      </main>
    </>
  );
}
