/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { InfoCard } from '@backstage/core-components';
import { Button } from '@backstage/ui';

import { useTranslation } from '../hooks/useTranslation';

const Code = ({ children }: { children: React.ReactNode }) => (
  <pre>{children}</pre>
);

export const I18NextDemoCard = () => {
  const { t } = useTranslation();

  return (
    <InfoCard title="i18next demos">
      <table
        style={{ width: '100%', borderCollapse: 'collapse' }}
        cellPadding={5}
        border={1}
      >
        <tr style={{ color: 'white', backgroundColor: 'darkgreen' }}>
          <th colSpan={3}>Essentials</th>
        </tr>
        <tr>
          <td rowSpan={2}>
            <Code>
              {JSON.stringify(
                {
                  essentials: {
                    key: 'value of key',
                    look: {
                      deep: 'value of look deep',
                    },
                  },
                },
                null,
                2,
              )}
            </Code>
          </td>
          <td>
            <Code>t('essentials.key')</Code>
          </td>
          <td>{t('essentials.key')}</td>
        </tr>
        <tr>
          <td>
            <Code>t('essentials.look.deep')</Code>
          </td>
          <td>{t('essentials.look.deep')}</td>
        </tr>

        <tr style={{ color: 'white', backgroundColor: 'darkgreen' }}>
          <th colSpan={3}>Interpolation</th>
        </tr>
        <tr>
          <td rowSpan={3}>
            <Code>
              {JSON.stringify(
                {
                  interpolation: {
                    key: '{{what}} is {{how}}',
                    nested: {
                      key: '{{what}} is {{how.value}}',
                    },
                    complex: {
                      message: 'Here is a {{link}}.',
                      linkText: 'link',
                    },
                  },
                },
                null,
                2,
              )}
            </Code>
          </td>
          <td>
            <Code>
              {"t('interpolation.key', {\n  what: 'This',\n  how: 'that',\n})"}
            </Code>
          </td>
          <td>
            {t('interpolation.key', { what: 'This', how: 'that' } as any)}
          </td>
        </tr>
        <tr>
          <td>
            <Code>
              {
                "t('interpolation.nested.key', {\n  what: 'This',\n  how: { value: 'that' }\n})"
              }
            </Code>
          </td>
          <td>
            {t('interpolation.nested.key', {
              what: 'This',
              how: { value: 'that' },
            } as any)}
          </td>
        </tr>
        <tr>
          <td>
            <Code>
              {
                "t('interpolation.complex.message', {\n  link: (\n    <Button ...>\n      {t('interpolation.complex.linkText')}\n    </Button>\n  ),\n})"
              }
            </Code>
          </td>
          <td>
            {t('interpolation.complex.message', {
              link: (
                // eslint-disable-next-line no-alert
                <Button onClick={() => alert('clicked')}>
                  {t('interpolation.complex.linkText')}
                </Button>
              ),
            } as any)}
          </td>
        </tr>

        <tr style={{ color: 'white', backgroundColor: 'darkgreen' }}>
          <th colSpan={3}>Formatting</th>
        </tr>
        <tr>
          <td rowSpan={8}>
            <Code>
              {JSON.stringify(
                {
                  formatting: {
                    intlNumber: 'Some {{val, number}}',
                    intlNumberWithOptions:
                      'Some {{val, number(minimumFractionDigits: 2)}}',
                    intlDateTime: 'On the {{val, datetime}}',
                    intlRelativeTime: 'Lorem {{val, relativetime}}',
                    intlRelativeTimeWithOptions:
                      'Lorem {{val, relativetime(quarter)}}',
                    intlRelativeTimeWithOptionsExplicit:
                      'Lorem {{val, relativetime(range: quarter; style: narrow;)}}',
                  },
                },
                null,
                2,
              )
                .replaceAll('": "', '":\n      "')
                .replaceAll('relativetime(', 'relativetime(\n        ')}
            </Code>
          </td>
          <td>
            <Code>{"t('formatting.intlNumber', {\n  val: 1234.56,\n})"}</Code>
          </td>
          <td>{t('formatting.intlNumber', { val: 1234.56 } as any)}</td>
        </tr>
        <tr>
          <td>
            <Code>
              {"t('formatting.intlNumberWithOptions', {\n  val: 1234,\n})"}
            </Code>
          </td>
          <td>{t('formatting.intlNumberWithOptions', { val: 1234 } as any)}</td>
        </tr>
        <tr>
          <td>
            <Code>
              {"t('formatting.intlDateTime', {\n  val: new Date(...),\n})"}
            </Code>
          </td>
          <td>
            {t('formatting.intlDateTime', {
              val: new Date(Date.UTC(2012, 11, 20, 3, 0, 0)),
            } as any)}
          </td>
        </tr>
        <tr>
          <td>
            <Code>
              {
                "t('formatting.intlDateTime', {\n  val: new Date(...),\n  formatParams: {\n    weekday: 'long',\n    year: 'numeric',\n    month: 'long',\n    day: 'numeric'\n  }\n})"
              }
            </Code>
          </td>
          <td>
            {t('formatting.intlDateTime', {
              val: new Date(Date.UTC(2012, 11, 20, 3, 0, 0)),
              formatParams: {
                val: {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              },
            } as any)}
          </td>
        </tr>
        <tr>
          <td>
            <Code>{"t('formatting.intlRelativeTime', {\n  val: 3,\n})"}</Code>
          </td>
          <td>{t('formatting.intlRelativeTime', { val: 3 } as any)}</td>
        </tr>
        <tr>
          <td>
            <Code>
              {"t('formatting.intlRelativeTimeWithOptions', {\n  val: -3,\n})"}
            </Code>
          </td>
          <td>
            {t('formatting.intlRelativeTimeWithOptions', { val: -3 } as any)}
          </td>
        </tr>
        <tr>
          <td>
            <Code>
              {
                "t('formatting.intlRelativeTimeWithOptionsExplicit', {\n  val: -3,\n})"
              }
            </Code>
          </td>
          <td>
            {t('formatting.intlRelativeTimeWithOptionsExplicit', {
              val: -3,
            } as any)}
          </td>
        </tr>
        <tr>
          <td>
            <Code>
              {
                "t('formatting.intlRelativeTimeWithOptionsExplicit', {\n  val: -3,\n})"
              }
            </Code>
          </td>
          <td>
            {t('formatting.intlRelativeTimeWithOptionsExplicit', {
              val: -3,
              style: 'long',
            } as any)}
          </td>
        </tr>

        <tr style={{ color: 'white', backgroundColor: 'darkorange' }}>
          <th colSpan={3}>Plurals - only one and other suffix is working</th>
        </tr>
        {[-3, -2, -1, 0, 1, 2, 3].map((count, index) => (
          <tr key={`plurals-key-${count}`}>
            {index === 0 ? (
              <td rowSpan={7}>
                <Code>
                  {JSON.stringify(
                    {
                      plurals: {
                        key_zero: 'zero',
                        key_one: 'one',
                        key_two: 'two',
                        key_few: 'few',
                        key_many: 'many',
                        key_other: 'other',
                      },
                    },
                    null,
                    2,
                  )}
                </Code>
              </td>
            ) : null}
            <td>
              <Code>{`t('plurals.key', { count: ${count} })`}</Code>
            </td>
            <td>{t('plurals.key', { count } as any)}</td>
          </tr>
        ))}
        {[-3, -2, -1, 0, 1, 2, 3].map((count, index) => (
          <tr key={`plurals-keyWithCount-${count}`}>
            {index === 0 ? (
              <td rowSpan={7}>
                <Code>
                  {JSON.stringify(
                    {
                      plurals: {
                        keyWithCount_one: '{{count}} item',
                        keyWithCount_other: '{{count}} items',
                      },
                    },
                    null,
                    2,
                  )}
                </Code>
              </td>
            ) : null}
            <td>
              <Code>{`t('plurals.keyWithCount', { count: ${count} })`}</Code>
            </td>
            <td>{t('plurals.keyWithCount', { count })}</td>
          </tr>
        ))}

        <tr style={{ color: 'white', backgroundColor: 'darkgreen' }}>
          <th colSpan={3}>Context</th>
        </tr>
        <tr>
          <td rowSpan={3}>
            <Code>
              {JSON.stringify(
                {
                  context: {
                    friend: 'A friend',
                    friend_male: 'A boyfriend',
                    friend_female: 'A girlfriend',
                  },
                },
                null,
                2,
              )}
            </Code>
          </td>
          <td>
            <Code>t('context.friend')</Code>
          </td>
          <td>{t('context.friend')}</td>
        </tr>
        <tr>
          <td>
            <Code>{"t('context.friend', { context: 'male' })"}</Code>
          </td>
          <td>{t('context.friend', { context: 'male' } as any)}</td>
        </tr>
        <tr>
          <td>
            <Code>{"t('context.friend', { context: 'female' })"}</Code>
          </td>
          <td>{t('context.friend', { context: 'female' } as any)}</td>
        </tr>

        <tr>
          <th
            colSpan={3}
            style={{ color: 'white', backgroundColor: 'darkred' }}
          >
            Objects and arrays - returnObjects is not supported
          </th>
        </tr>
        <tr>
          <td rowSpan={2}>
            <Code>
              {JSON.stringify(
                {
                  context: {
                    friend: 'A friend',
                    friend_male: 'A boyfriend',
                    friend_female: 'A girlfriend',
                  },
                },
                null,
                2,
              )}
            </Code>
          </td>
          <td>
            <Code>{"t('objects.tree', { returnObjects: true })"}</Code>
          </td>
          <td>{t('objects.tree' as any, { returnObjects: true } as any)}</td>
        </tr>
        <tr>
          <td>
            <Code>{"t('arrays.array', { returnObjects: true })"}</Code>
          </td>
          <td>{t('arrays.array', { returnObjects: true } as any)}</td>
        </tr>
      </table>
    </InfoCard>
  );
};
