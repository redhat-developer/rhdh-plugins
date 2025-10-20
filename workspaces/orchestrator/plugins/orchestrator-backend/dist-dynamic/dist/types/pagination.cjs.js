'use strict';

function buildPagination(req) {
  const pagination = {
    limit: void 0,
    offset: void 0,
    order: void 0,
    sortField: void 0
  };
  if (!req.body?.paginationInfo) {
    return pagination;
  }
  const { offset, pageSize, orderBy, orderDirection } = req.body.paginationInfo;
  if (!isNaN(Number(offset))) {
    pagination.offset = Number(offset);
  }
  if (!isNaN(Number(pageSize))) {
    pagination.limit = Number(pageSize);
  }
  if (orderBy) {
    pagination.sortField = String(orderBy);
  }
  if (orderDirection) {
    pagination.order = String(orderDirection).toUpperCase();
  }
  return pagination;
}

exports.buildPagination = buildPagination;
//# sourceMappingURL=pagination.cjs.js.map
