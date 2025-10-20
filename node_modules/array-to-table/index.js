/**
 * Generate markdown table from an array of objects
 *
 * @param  {Array} array    Array of objects
 * @param  {Array} columns  Optional, table column names, otherwise taken from the keys of the first object
 *
 * @return {String} Markdown table
 */
module.exports = function arrayToTable (array, columns) {
  var table = ""

  // Generate column list
  var cols = columns
    ? columns.split(",")
    : Object.keys(array[0])

  // Generate table headers
  table += cols.join(" | ")
  table += "\r\n"

  // Generate table header seperator
  table += cols.map(function () {
    return '---'
  }).join(' | ')
  table += "\r\n"

  // Generate table body
  array.forEach(function (item) {
    table += cols.map(function (key) {
      return String(item[key] || "")
    }).join(" | ") + "\r\n"
  })

  // Return table
  return table
}
