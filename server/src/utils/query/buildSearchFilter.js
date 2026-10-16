"use strict";

function buildSearchFilter(search) {
  if (!search || typeof search !== "string" || search.trim() === "") {
    return null;
  }

  const term = search.trim();

  return {
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { employeeCode: { contains: term, mode: "insensitive" } },
    ],
  };
}

module.exports = { buildSearchFilter };
