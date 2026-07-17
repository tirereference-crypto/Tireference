import { SITE_CONTENT_UPDATED } from '../editorial';
import { defaultEditorialSchemaRefs } from '../people';
import {
  buildArticleSchema,
  buildDefaultPublishDate,
  type ArticleSchemaInput,
} from './schema';

type EditorialArticleInput = Pick<
  ArticleSchemaInput,
  'headline' | 'description' | 'url' | 'type' | 'additionalProperty' | 'datePublished'
> & {
  dateModified?: string;
};

/** Article/TechArticle JSON-LD with default author and reviewer Person refs. */
export function buildEditorialArticleSchema(input: EditorialArticleInput): Record<string, unknown> {
  const refs = defaultEditorialSchemaRefs();
  return buildArticleSchema({
    ...input,
    authorRef: refs.authorRef,
    reviewerRef: refs.reviewerRef,
    datePublished: input.datePublished ?? buildDefaultPublishDate(),
    dateModified: input.dateModified ?? SITE_CONTENT_UPDATED,
    type: input.type ?? 'TechArticle',
  });
}
