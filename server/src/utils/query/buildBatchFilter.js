"use strict";

function buildBatchFilter(query = {}) {
  const filter = {};
  const options = {};

  if (query.status) {
    filter.status = query.status;
  }

  const limit = query.limit !== undefined ? Number(query.limit) : undefined;
  if (limit !== undefined && Number.isFinite(limit) && limit > 0) {
    options.take = limit;
  }

  return { filter, options };
}

module.exports = { buildBatchFilter };
