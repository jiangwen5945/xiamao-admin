export function cleanParams(params) {
  const result = { ...params }
  Object.keys(result).forEach(k => {
    if (result[k] === '' || result[k] === null || result[k] === undefined) {
      delete result[k]
    }
    if (Array.isArray(result[k]) && !result[k].length) {
      delete result[k]
    }
  })
  return result
}
