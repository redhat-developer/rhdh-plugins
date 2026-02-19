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
    height: 30,
  },
  path: {
    fill: '#7df3e1',
  },
});
const LogoFull = () => {
  const classes = useStyles();

  return (
    <svg
      className={classes.svg}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2079.95 456.05"
    >
      <path
        className={classes.path}
        d="M302.9,180a80.62,80.62,0,0,0,13.44-10.37c.8-.77,1.55-1.54,2.31-2.31a81.89,81.89,0,0,0,7.92-9.37,62.37,62.37,0,0,0,6.27-10.77,48.6,48.6,0,0,0,4.36-16.4c1.49-19.39-10-38.67-35.62-54.22L198.42,14,78.16,129.22l-78.29,75,108.6,65.9a111.6,111.6,0,0,0,57.76,16.42c24.92,0,48.8-8.8,66.42-25.69,19.16-18.36,25.52-42.12,13.7-61.87a49.69,49.69,0,0,0-6.8-8.87,89.78,89.78,0,0,0,19.28,2.15H259a85.09,85.09,0,0,0,31-5.79A80.88,80.88,0,0,0,302.9,180Z"
      />
    </svg>
  );
};

export default LogoFull;
