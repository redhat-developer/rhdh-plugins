'use strict';

function buildGraphQlQuery(args) {
  let query = `{${args.type}`;
  const whereClause = buildWhereClause(args.whereClause);
  const paginationClause = buildPaginationClause(args.pagination);
  if (whereClause || paginationClause) {
    query += " (";
    query += [whereClause, paginationClause].filter(Boolean).join(", ");
    query += ") ";
  }
  query += ` {${args.queryBody} } }`;
  return query.replace(/\s+/g, " ").trim();
}
function buildWhereClause(whereClause) {
  return whereClause ? `where: {${whereClause}}` : "";
}
function buildPaginationClause(pagination) {
  if (!pagination) return "";
  const parts = [];
  if (pagination.sortField !== void 0) {
    parts.push(
      `orderBy: {${pagination.sortField}: ${pagination.order !== void 0 ? pagination.order?.toUpperCase() : "ASC"}}`
    );
  }
  const paginationParts = [];
  if (pagination.limit !== void 0) {
    paginationParts.push(`limit: ${pagination.limit}`);
  }
  if (pagination.offset !== void 0) {
    paginationParts.push(`offset: ${pagination.offset}`);
  }
  if (paginationParts.length) {
    parts.push(`pagination: {${paginationParts.join(", ")}}`);
  }
  return parts.join(", ");
}

exports.buildGraphQlQuery = buildGraphQlQuery;
//# sourceMappingURL=queryBuilder.cjs.js.map
