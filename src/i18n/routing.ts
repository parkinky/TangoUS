import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ko', 'en', 'es', 'ja', 'zh'],
  defaultLocale: 'ko',
});
