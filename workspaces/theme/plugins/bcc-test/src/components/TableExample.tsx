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

import { Table, TableColumn, Avatar } from '@backstage/core-components';

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

const columns: TableColumn<User>[] = [
  {
    title: 'Avatar',
    field: 'picture',
    render: user => (
      <Avatar
        displayName={`${user.name.first} ${user.name.last}`}
        picture={user.picture}
      />
    ),
    sorting: false,
  },
  { title: 'Lastname', field: 'name.last', highlight: true },
  { title: 'Firstname', field: 'name.first' },
  { title: 'Email', field: 'email' },
];

export const TableExample = () => {
  return <Table title="Table Example" columns={columns} data={users} />;
};
