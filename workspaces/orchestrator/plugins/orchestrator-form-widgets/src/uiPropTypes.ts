import { JsonValue } from '@backstage/types/index';
import { Variant } from '@material-ui/core/styles/createTypography';

export type UiProps = {
  'ui:variant'?: Variant;
  'ui:text'?: string;
  'fetch:url'?: string;
  'fetch:method'?: 'GET' | 'POST';
  'fetch:headers'?: Record<string, string>;
  'fetch:body'?: Record<string, JsonValue>;
  'fetch:retrigger'?: string[];
  [key: `fetch:response:${string}`]: string;
};

export const isFetchResponseKey = (
  key: string,
): key is `fetch:response:${string}` => {
  return key.startsWith('fetch:response:');
};
