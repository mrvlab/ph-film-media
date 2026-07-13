// Opt the Studio out of the app's 1rem=10px + --sw scaling: an inline style on the
// root outranks globals.css, so the Studio renders at a normal 16px root. Pre-paint
// to avoid a flash; /studio is a full-reload boundary, so no cleanup is needed.
const resetRootFontSize = `document.documentElement.style.fontSize='100%'`;

export default function SanityStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='lg:col-span-full lg:row-span-full lg:overflow-auto lg:h-screen'>
      <script dangerouslySetInnerHTML={{ __html: resetRootFontSize }} />
      {children}
    </div>
  );
}
