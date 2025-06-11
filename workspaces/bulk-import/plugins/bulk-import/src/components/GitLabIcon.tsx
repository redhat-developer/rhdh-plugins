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
import type { FC, HTMLProps, ReactElement } from 'react';

const GitLabIcon: FC<HTMLProps<SVGElement>> = ({ style }): ReactElement => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={style}
    >
      <g clipPath="url(#clip0_8_2670)">
        <path
          d="M15.7343 6.0996L15.7118 6.04211L13.534 0.358476C13.4897 0.247079 13.4112 0.152581 13.3099 0.0885407C13.2085 0.0255879 13.0902 -0.00473225 12.971 0.00167418C12.8518 0.00808061 12.7374 0.0509051 12.6434 0.124365C12.5503 0.199935 12.4828 0.302334 12.4501 0.417628L10.9796 4.91655H5.02519L3.55471 0.417628C3.52282 0.301706 3.45518 0.198794 3.36142 0.123532C3.26734 0.0500718 3.15299 0.0072473 3.0338 0.00084087C2.91461 -0.00556556 2.79633 0.0247546 2.69492 0.0877073C2.5938 0.152007 2.51541 0.246422 2.4708 0.357642L0.288828 6.03878L0.267166 6.09626C-0.0463398 6.9154 -0.085037 7.81426 0.156909 8.65732C0.398855 9.50037 0.908327 10.2419 1.60851 10.7701L1.61601 10.776L1.636 10.7901L4.95354 13.2745L6.59481 14.5167L7.59457 15.2716C7.71151 15.3603 7.85431 15.4084 8.00114 15.4084C8.14797 15.4084 8.29077 15.3603 8.40771 15.2716L9.40747 14.5167L11.0487 13.2745L14.3863 10.7751L14.3946 10.7685C15.0932 10.2402 15.6015 9.49937 15.8431 8.65745C16.0847 7.81554 16.0465 6.91796 15.7343 6.0996Z"
          fill="#6A6E73"
        />
      </g>
      <defs>
        <clipPath id="clip0_8_2670">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default GitLabIcon;
