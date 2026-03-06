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

import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  svg: {
    width: 'auto',
    height: 28,
  },
  path: {
    fill: '#7df3e1',
  },
});

const LogoIcon = () => {
  const classes = useStyles();

  return (
    <svg
      className={classes.svg}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 337.46 428.5"
    >
      <path
        className={classes.path}
        d="M303,166.05a80.69,80.69,0,0,0,13.45-10.37c.79-.77,1.55-1.53,2.3-2.3a83.12,83.12,0,0,0,7.93-9.38A63.69,63.69,0,0,0,333,133.23a48.58,48.58,0,0,0,4.35-16.4c1.49-19.39-10-38.67-35.62-54.22L198.56,0,78.3,115.23,0,190.25l108.6,65.91a111.59,111.59,0,0,0,57.76,16.41c24.92,0,48.8-8.8,66.42-25.69,19.16-18.36,25.52-42.12,13.7-61.87a49.22,49.22,0,0,0-6.8-8.87A89.17,89.17,0,0,0,259,178.29h.15a85.08,85.08,0,0,0,31-5.79A80.88,80.88,0,0,0,303,166.05Z"
      />
    </svg>
  );
};

export default LogoIcon;
