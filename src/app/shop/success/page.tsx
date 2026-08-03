import Header from '@/components/Header/Header';
import { Link } from 'next-view-transitions';

type SearchParams = Promise<{ session_id?: string }>;

export default async function ShopSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id } = await searchParams;

  return (
    <>
      <Header />
      <main
        className='grid lg:col-span-10 lg:row-span-full lg:overflow-y-scroll lg:py-p-desktop'
        id='shop-success-main'
      >
        <div className='flex min-h-screen flex-col items-center justify-center gap-6 px-p-mobile py-16 text-center lg:min-h-full lg:gap-8 lg:px-0 lg:py-0'>
          {/* Hero — mirrors the ticket success display size */}
          <h1 className='text-[18rem] uppercase leading-[0.9] text-white/95 lg:text-[24.8rem]'>
            Tack
          </h1>

          <p className='max-w-[30ch] text-balance text-b-14 text-white/70 lg:max-w-[48ch] lg:text-b-16'>
            Tack för ditt köp! Vi skickar en orderbekräftelse till din e-post
            inom kort.
          </p>

          {/* Reference for customer support */}
          {session_id ? (
            <p className='flex flex-col text-b-9 uppercase tracking-[0.12em] text-white/40'>
              Referensnummer:{' '}
              <code className='break-all font-mono normal-case'>
                {session_id}
              </code>
            </p>
          ) : null}

          <Link href='/shop' className='primary-button mt-2 lg:mt-4'>
            Tillbaka till butiken
          </Link>
        </div>
      </main>
    </>
  );
}
