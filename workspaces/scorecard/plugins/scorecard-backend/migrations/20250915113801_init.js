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

exports.up = async function up(knex) {
  await knex.schema.createTable('metric_values', table => {
    table.comment('Table containing calculated metric values');
    table
      .bigIncrements('id')
      .primary()
      .comment('Auto-incrementing primary key');
    table.string('metric_id').notNullable();
    table
      .string('catalog_entity_ref')
      .notNullable()
      .comment('The entity ref for which this metric value was calculated');
    table
      .json('value')
      .nullable()
      .comment('Metric value when calculation succeeds');
    table
      .dateTime('timestamp', { precision: 0 })
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment('The timestamp when this entry was created');
    table
      .text('error_message')
      .nullable()
      .comment('Error details when calculation fails');

    table.index(['catalog_entity_ref', 'metric_id', 'id'], 'idx_entity_metric');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTable('metric_results');
};
