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
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  withPadding: {
    padding: 32,
    backgroundColor: 'gray',
  },
  withSpacing: {
    padding: theme.spacing(4),
    backgroundColor: theme.palette.background.default,
  },
}));

export const InlineStyles = () => {
  const classes = useStyles();
  return (
    <InfoCard title="Inline styles">
      <h1>Default button</h1>
      <Button>a button</Button>

      <h1>
        Default button with{' '}
        <code>
          {
            "makeStyles({ withPadding: { padding: 32, backgroundColor: 'gray' }})"
          }
        </code>
      </h1>
      <Button className={classes.withPadding}>a button</Button>

      <h1>
        Default button with{' '}
        <code>
          {
            'makeStyles({ withSpacing: { padding: theme.spacing(4), backgroundColor: theme.palette.background.default }})'
          }
        </code>
      </h1>
      <Button className={classes.withSpacing}>a button</Button>

      <h1>
        Default button with{' '}
        <code>{"style={{ padding: 32, backgroundColor: 'gray' }}"}</code>
      </h1>
      <Button style={{ padding: 32, backgroundColor: 'gray' }}>a button</Button>
    </InfoCard>
  );
};
