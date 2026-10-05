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

/**
 * Relationship types for the AI knowledge graph.
 *
 * These constants define the semantic edges between nodes in the
 * Neo4j graph, enabling knowledge graph queries like "which tools
 * does this agent use?" or "which agents belong to this skill
 * bundle?".
 *
 * @public
 */
export const RELATIONSHIP_TYPES = {
  /** Entity A depends on entity B (e.g. agent depends on a model). */
  DEPENDS_ON: 'DEPENDS_ON',
  /** Entity A uses entity B as a tool (e.g. agent uses an MCP server). */
  USES_TOOL: 'USES_TOOL',
  /** Entity A belongs to entity B (e.g. skill belongs to a bundle). */
  BELONGS_TO: 'BELONGS_TO',
  /** Entity A is semantically similar to entity B. */
  SIMILAR_TO: 'SIMILAR_TO',
  /** Entity A is implemented by entity B (e.g. agent spec by a deployment). */
  IMPLEMENTED_BY: 'IMPLEMENTED_BY',
  /** Entity A includes entity B (e.g. bundle includes skills). */
  INCLUDES: 'INCLUDES',
} as const;

/**
 * Union type of all allowed relationship types.
 *
 * @public
 */
export type RelationshipType =
  (typeof RELATIONSHIP_TYPES)[keyof typeof RELATIONSHIP_TYPES];

/**
 * Adapter interface for syncing AI asset entities to a Neo4j
 * knowledge graph.
 *
 * Implementations translate catalog entity mutations (create,
 * update, delete) into Neo4j graph operations, maintaining a
 * synchronized knowledge graph that enables rich queries across
 * AI assets.
 *
 * @public
 */
export interface Neo4jSyncAdapter {
  /**
   * Create a new node in the knowledge graph.
   *
   * Called when a new AI asset entity is ingested into the catalog.
   * The node properties should include all relevant entity metadata
   * (name, category, version, source, annotations).
   *
   * @param entityRef - The Backstage entity reference
   *   (e.g. `"resource:default/my-agent"`).
   * @param properties - Key-value pairs to store on the node.
   */
  createNode(
    entityRef: string,
    properties: Record<string, unknown>,
  ): Promise<void>;

  /**
   * Update an existing node in the knowledge graph.
   *
   * Called when a previously ingested AI asset entity is updated.
   * Only the changed properties need to be provided — existing
   * properties not in the update are preserved.
   *
   * @param entityRef - The Backstage entity reference.
   * @param properties - Key-value pairs to update on the node.
   */
  updateNode(
    entityRef: string,
    properties: Record<string, unknown>,
  ): Promise<void>;

  /**
   * Delete a node and all its relationships from the knowledge graph.
   *
   * Called when an AI asset entity is removed from the catalog.
   *
   * @param entityRef - The Backstage entity reference.
   */
  deleteNode(entityRef: string): Promise<void>;

  /**
   * Create a directed relationship between two nodes.
   *
   * Relationships encode semantic edges used for knowledge graph
   * queries (e.g. "which tools does agent X use?" via `USES_TOOL`,
   * "which skills are in bundle Y?" via `INCLUDES`).
   *
   * @param fromRef - The source entity reference.
   * @param toRef - The target entity reference.
   * @param type - The relationship type (one of {@link RelationshipType}).
   * @param metadata - Optional key-value metadata to attach to the edge.
   */
  createRelationship(
    fromRef: string,
    toRef: string,
    type: RelationshipType,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
}
