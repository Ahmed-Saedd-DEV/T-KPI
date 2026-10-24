"use strict";

function buildDateRangeFilter(from, to) {
  const filter = {};

  if (from) {
    filter.gte = new Date(from + "T00:00:00.000Z");
  }

  if (to) {
    filter.lte = new Date(to + "T23:59:59.999Z");
  }

  if (Object.keys(filter).length === 0) {
    return undefined;
  }

  return { metricDate: filter };
}

module.exports = { buildDateRangeFilter };
