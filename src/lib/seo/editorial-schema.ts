import { SITE_CONTENT_UPDATED } from '../editorial';
import {
  buildArticleSchema,
  type ArticleSchemaInput,
} from './schema';

type EditorialArticleInput = Pick<
  ArticleSchemaInput,
  'headline' | 'description' | 'url' | 'type' | 'additionalProperty' | 'datePublished'
> & {
  dateModified?: string;
};

/**
 * Article/TechArticle JSON-LD with Tire Reference (Organization) as author.
 * Individual named authors/reviewers are not used on this site.
 */
export function buildEditorialArticleSchema(input: EditorialArticleInput): Record<string, unknown> {
  return buildArticleSchema({
    ...input,
    datePublished: input.datePublished ?? SITE_CONTENT_UPDATED,
    dateModified: input.dateModified ?? SITE_CONTENT_UPDATED,
    type: input.type ?? 'TechArticle',
  });
}
