import { createTranslationRef } from '@backstage/core-plugin-api/alpha';
export const messages = createTranslationRef({
  id: 'test',
  messages: { title: 'Test' },
});
