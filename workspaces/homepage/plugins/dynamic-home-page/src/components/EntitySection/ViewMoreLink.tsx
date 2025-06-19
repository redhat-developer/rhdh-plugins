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
import type { ReactNode, FC } from 'react';
import { Link, LinkProps } from '@backstage/core-components';
import Typography from '@mui/material/Typography';

interface ViewMoreLinkProps extends LinkProps {
  to: string;
  children: string | ReactNode;
}

export const ViewMoreLink: FC<ViewMoreLinkProps> = ({ to, children }) => {
  return (
    <Link to={to} underline="always" style={{ textUnderlineOffset: '4px' }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {children}
      </Typography>
    </Link>
  );
};
