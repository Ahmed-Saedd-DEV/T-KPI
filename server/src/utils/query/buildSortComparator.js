"use strict";

function buildSortComparator(sortBy, order) {
  const direction = order === "asc" ? 1 : -1;

  return function compare(a, b) {
    if (sortBy === "score") {
      const aScore = a.kpi?.overallScore ?? 0;
      const bScore = b.kpi?.overallScore ?? 0;
      return (aScore - bScore) * direction;
    }
    if (sortBy === "name") {
      return (
        String(a.name || "")
          .toLowerCase()
          .localeCompare(String(b.name || "").toLowerCase()) * direction
      );
    }
    if (sortBy === "orders") {
      return ((a.orders ?? 0) - (b.orders ?? 0)) * direction;
    }
    return (
      String(a.employeeCode || "")
        .toLowerCase()
        .localeCompare(String(b.employeeCode || "").toLowerCase()) * direction
    );
  };
}

module.exports = { buildSortComparator };
