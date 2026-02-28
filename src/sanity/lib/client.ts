// src/sanity/client.ts

import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId, studioUrl } from '../env';
import { token } from './token';

export const client = createClient({
  projectId: projectId,
  dataset: dataset,
  apiVersion: apiVersion,
  useCdn: true,
  token: token,
  stega: {
    studioUrl: `${studioUrl}/studio`,
  },
});
