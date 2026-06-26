function scanRule(rule, regex, icons) {
  if (!rule.selectorText) return
  let m
  while ((m = regex.exec(rule.selectorText)) !== null) icons.add(m[1])
}

export function getElementIcons() {
  const icons = new Set()
  const regex = /\.el-icon-([\w-]+)/g
  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules
        if (!rules) continue
        for (const rule of rules) {
          scanRule(rule, regex, icons)
          if (rule.cssRules) {
            for (const subRule of rule.cssRules) scanRule(subRule, regex, icons)
          }
        }
      } catch {}
    }
  } catch {}
  return [...icons].sort()
}
