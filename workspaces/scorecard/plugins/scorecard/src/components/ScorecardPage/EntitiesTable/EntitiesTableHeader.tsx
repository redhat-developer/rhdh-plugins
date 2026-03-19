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

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableSortLabel from '@mui/material/TableSortLabel';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import { SCORECARD_ENTITIES_TABLE_HEADERS } from '../../../utils';
import { useTranslation } from '../../../hooks/useTranslation';

export interface EntitiesTableHeaderProps {
  orderBy: string | null;
  order: 'asc' | 'desc';
  onSortRequest: (columnId: string) => void;
}

export const EntitiesTableHeader = ({
  orderBy,
  order,
  onSortRequest,
}: EntitiesTableHeaderProps) => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow>
        {SCORECARD_ENTITIES_TABLE_HEADERS.map(header => (
          <TableCell key={header.id} align="left" sx={{ width: header.width }}>
            {header.sortable ? (
              <TableSortLabel
                active={orderBy === header.id}
                direction={orderBy === header.id ? order : 'asc'}
                onClick={() => onSortRequest(header.id)}
                IconComponent={KeyboardArrowUpIcon}
              >
                {t(header.label as any, { key: header.label })}
              </TableSortLabel>
            ) : (
              t(header.label as any, { key: header.label })
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};
