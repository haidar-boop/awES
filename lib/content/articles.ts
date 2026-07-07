export interface Article {
  slug: string;
  title: string;
  description: string;
  updated: string; // ISO date
  minutes: number;
  pillar?: boolean;
  faq: { q: string; a: string }[];
  body: string; // markdown
}

import { ARTICLES_1 } from './articles-1';
import { ARTICLES_2 } from './articles-2';

export const ARTICLES: Article[] = [...ARTICLES_1, ...ARTICLES_2];

export const articleBySlug = new Map(ARTICLES.map((a) => [a.slug, a]));

export const AUTHOR = {
  name: 'PennyRadar Editorial',
  url: '/about',
};
