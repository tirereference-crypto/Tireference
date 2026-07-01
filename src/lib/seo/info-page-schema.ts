import { buildPageSchema } from './page-schemas';
import { buildWebPageSchema } from './schema';

export function buildInfoPageSchema(
  title: string,
  description: string,
  path: string,
  breadcrumbLabel: string,
) {
  return buildPageSchema({
    breadcrumbs: [
      { name: 'Home', item: '/' },
      { name: breadcrumbLabel, item: path },
    ],
    extra: [
      buildWebPageSchema({
        name: title,
        description,
        url: path,
      }),
    ],
  });
}
