export default function SanityStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='lg:col-span-full lg:row-span-full lg:font-[1.2rem] lg:overflow-auto lg:h-screen'>
      {children}
    </div>
  );
}
