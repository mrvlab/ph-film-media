import 'server-only';

import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../env';

const writeToken = process.env.SANITY_WRITE_TOKEN;

if (!writeToken) {
  throw new Error('Missing SANITY_WRITE_TOKEN');
}

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: writeToken,
});
