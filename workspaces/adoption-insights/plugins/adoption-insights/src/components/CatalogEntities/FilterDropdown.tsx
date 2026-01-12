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
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useTranslation } from '../../hooks/useTranslation';

const FilterDropdown = ({
  selectedOption,
  handleChange,
  uniqueCatalogEntityKinds,
}: {
  selectedOption: string;
  handleChange: (event: SelectChangeEvent<string>) => void;
  uniqueCatalogEntityKinds: string[];
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ m: 2, minWidth: 160 }}>
      <FormControl fullWidth>
        <InputLabel id="kind-select">{t('filter.selectKind')}</InputLabel>
        <Select
          labelId="kind-select"
          renderValue={(selected: string) => {
            if (selected.length === 0) return t('filter.selectKind');
            if (selected === 'All') return t('filter.all');
            return selected;
          }}
          value={selectedOption}
          onChange={handleChange}
          label={t('filter.selectKind')}
          MenuProps={{
            MenuListProps: {
              autoFocusItem: false,
            },
          }}
        >
          <MenuItem key="All" value="All">
            {t('filter.all')}
          </MenuItem>
          {uniqueCatalogEntityKinds?.map(kind => (
            <MenuItem key={kind} value={kind}>
              {kind}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default FilterDropdown;
