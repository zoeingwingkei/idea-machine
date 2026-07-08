import productForms from './map-of-product-forms.json';
import humanLife from './map-of-human-life.json';
import twists from './map-of-twists.json';

interface CategoryGroup {
  category?: string;
  domain?: string;
  subItems: string[];
}

function flatten(groups: CategoryGroup[]): string[] {
  return groups.flatMap((group) => group.subItems);
}

export const formatPool = flatten(productForms.categories);
export const spacePool = flatten(humanLife.domains);
export const twistPool = flatten(twists.categories);

function pick(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface Idea {
  format: string;
  space: string;
  twist: string;
}

export function rollIdea(): Idea {
  return {
    format: pick(formatPool),
    space: pick(spacePool),
    twist: pick(twistPool),
  };
}

export function article(word: string): 'A' | 'An' {
  return /^[aeiou]/i.test(word) ? 'An' : 'A';
}
