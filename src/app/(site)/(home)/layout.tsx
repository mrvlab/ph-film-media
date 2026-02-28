import '@/app/globals.css';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { fetchFooter, fetchHome } from '@/sanity/lib/queries';
import { FetchFooterResult } from '../../../../sanity.types';
import { sanityFetch } from '@/sanity/lib/live';

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: homeData } = await sanityFetch({
    query: fetchHome,
    params: { slug: '/' },
  });

  const { data: footer }: { data: FetchFooterResult } = await sanityFetch({
    query: fetchFooter,
  });

  // Check if first block is hero carousel
  const firstBlock = homeData?.blockList?.[0];
  const isHeroCarousel =
    firstBlock && '_type' in firstBlock && firstBlock._type === 'heroCarousel';

  return (
    <>
      <Header />
      <main
        className={`grid ${isHeroCarousel ? '' : 'mt-[var(--header-height-mobile)] max-lg:pt-[22%]'} lg:mt-0 lg:col-span-10 lg:row-span-full lg:overflow-y-scroll lg:py-p-desktop`}
        id='home-main-content'
      >
        {children}
        <Footer footer={footer} />
      </main>
    </>
  );
}
