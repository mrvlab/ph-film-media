import { sanityFetch } from '@/sanity/lib/live';
import { fetchHeader } from '@/sanity/lib/queries';
import HeaderNav from './HeaderNav';

const Header = async () => {
  const { data: header } = await sanityFetch({ query: fetchHeader });

  return <HeaderNav header={header} />;
};

export default Header;
