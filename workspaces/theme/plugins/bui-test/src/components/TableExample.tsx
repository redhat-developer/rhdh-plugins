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

import { useMemo } from 'react';
import {
  CellProfile,
  CellText,
  ColumnConfig,
  Table,
  TableItem,
  useTable,
} from '@backstage/ui';

interface User {
  name: {
    first: string; // "Duane",
    last: string; // "Reed"
  };
  email: string; // "duane.reed@example.com"
  picture: string; // "https://api.dicebear.com/6.x/open-peeps/svg?seed=Duane"
}

const users: User[] = [
  {
    name: {
      first: 'Carolyn',
      last: 'Moore',
    },
    email: 'carolyn.moore@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Carolyn',
  },
  {
    name: {
      first: 'Esma',
      last: 'Berberoğlu',
    },
    email: 'esma.berberoglu@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Esma',
  },
  {
    name: {
      first: 'Isabella',
      last: 'Rhodes',
    },
    email: 'isabella.rhodes@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Isabella',
  },
  {
    name: {
      first: 'Derrick',
      last: 'Carter',
    },
    email: 'derrick.carter@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Derrick',
  },
  {
    name: {
      first: 'Mattie',
      last: 'Lambert',
    },
    email: 'mattie.lambert@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Mattie',
  },
  {
    name: {
      first: 'Mijat',
      last: 'Rakić',
    },
    email: 'mijat.rakic@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Mijat',
  },
  {
    name: {
      first: 'Javier',
      last: 'Reid',
    },
    email: 'javier.reid@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Javier',
  },
  {
    name: {
      first: 'Isabella',
      last: 'Li',
    },
    email: 'isabella.li@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Isabella',
  },
  {
    name: {
      first: 'Stephanie',
      last: 'Garrett',
    },
    email: 'stephanie.garrett@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Stephanie',
  },
  {
    name: {
      first: 'Antonia',
      last: 'Núñez',
    },
    email: 'antonia.nunez@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Antonia',
  },
  {
    name: {
      first: 'Donald',
      last: 'Young',
    },
    email: 'donald.young@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Donald',
  },
  {
    name: {
      first: 'Iegor',
      last: 'Holodovskiy',
    },
    email: 'iegor.holodovskiy@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Iegor',
  },
  {
    name: {
      first: 'Jessica',
      last: 'David',
    },
    email: 'jessica.david@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Jessica',
  },
  {
    name: {
      first: 'Eve',
      last: 'Martinez',
    },
    email: 'eve.martinez@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Eve',
  },
  {
    name: {
      first: 'Caleb',
      last: 'Silva',
    },
    email: 'caleb.silva@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Caleb',
  },
  {
    name: {
      first: 'Marcia',
      last: 'Jenkins',
    },
    email: 'marcia.jenkins@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Marcia',
  },
  {
    name: {
      first: 'Mackenzie',
      last: 'Jones',
    },
    email: 'mackenzie.jones@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Mackenzie',
  },
  {
    name: {
      first: 'Jeremiah',
      last: 'Gutierrez',
    },
    email: 'jeremiah.gutierrez@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Jeremiah',
  },
  {
    name: {
      first: 'Luciara',
      last: 'Souza',
    },
    email: 'luciara.souza@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Luciara',
  },
  {
    name: {
      first: 'Valgi',
      last: 'da Cunha',
    },
    email: 'valgi.dacunha@example.com',
    picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Valgi',
  },
];

interface RowData extends TableItem {
  user: User;
}

export const TableExample = () => {
  const columnConfig = useMemo<ColumnConfig<RowData>[]>(
    () => [
      {
        id: 'lastname',
        label: 'Lastname',
        cell: item => (
          <CellProfile src={item.user.picture} name={item.user.name.last} />
        ),
        isRowHeader: true,
        isSortable: true,
      },
      {
        id: 'firstname',
        label: 'Firstname',
        cell: item => <CellText title={item.user.name.first} />,
        isSortable: true,
      },
      {
        id: 'email',
        label: 'Email',
        cell: item => <CellText title={item.user.email} />,
        isSortable: true,
      },
    ],
    [],
  );

  const data = useMemo<RowData[]>(
    () =>
      users.map((user, index) => ({
        id: String(index),
        user,
      })),
    [],
  );

  const { tableProps } = useTable({
    mode: 'complete',
    data,
    initialSort: { column: 'lastname', direction: 'ascending' },
    sortFn: (items, { column, direction }) => {
      return [...items].sort((a, b) => {
        let aVal: string;
        let bVal: string;
        switch (column) {
          case 'lastname':
            aVal = a.user.name.last;
            bVal = b.user.name.last;
            break;
          case 'firstname':
            aVal = a.user.name.first;
            bVal = b.user.name.first;
            break;
          case 'email':
            aVal = a.user.email;
            bVal = b.user.email;
            break;
          default:
            return 0;
        }
        const cmp = aVal.localeCompare(bVal);
        return direction === 'descending' ? -cmp : cmp;
      });
    },
  });

  return <Table columnConfig={columnConfig} {...tableProps} />;
};
