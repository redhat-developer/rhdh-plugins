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

import * as React from 'react';

import { makeStyles } from '@mui/styles';

import { getImageForIconClass } from '../../utils/icons';

const useStyles = makeStyles(() => ({
  text: {
    maxWidth: '150px',
    textAlign: 'center',
  },
  img: {
    justifyContent: 'center',
    display: 'flex',
  },
}));

export const Illustrations = ({
  iconClassname,
  iconText,
}: {
  iconClassname: string;
  iconText: string;
}) => {
  const styles = useStyles();
  return (
    <div>
      <span className={styles.img}>
        <img
          src={getImageForIconClass(iconClassname)}
          alt={iconText}
          height="100px"
        />
      </span>
      <p className={styles.text}>{iconText}</p>
    </div>
  );
};
