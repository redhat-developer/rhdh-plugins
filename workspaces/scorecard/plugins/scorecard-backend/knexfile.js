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

// To create new migration file use: "yarn knex migrate:make migrations",
// open generated new migration file and edit it to complete code.
//
// This `knexfile.js` exports multiple named environments, so you must specify
// which one to use with `--env` when running migrations.
//
// Examples:
// - sqlite3: "yarn knex --env sqlite3 migrate:latest"
// - pg: "yarn knex --env pg migrate:latest"
//
// To run new migration use: "yarn knex --env sqlite3 migrate:up some_file_name"
// To run latest migration use: "yarn knex --env sqlite3 migrate:latest"
// To rollback concrete migration use: "yarn knex --env sqlite3 migrate:down some_file_name"
// To rollback latest migration batch use: "yarn knex --env sqlite3 migrate:rollback"

module.exports = {
  sqlite3: {
    client: 'better-sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    migrations: {
      directory: './migrations',
    },
  },
  pg: {
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT, 10),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    },
    migrations: {
      directory: './migrations',
    },
  },
};
