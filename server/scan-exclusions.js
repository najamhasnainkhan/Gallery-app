const path = require('path')

// These locations contain Windows, installed applications, or generated caches—not user media libraries.
const excludedNames = new Set([
  'windows', 'program files', 'program files (x86)', 'programdata', 'appdata',
  '$recycle.bin', 'system volume information', 'recovery', 'perflogs',
  'node_modules', 'temporary internet files', 'inetcache', 'packages', 'cache', 'temp'
])

function isExcludedFolder(folderPath) {
  const name = path.basename(folderPath).toLowerCase()
  return name.startsWith('.') || excludedNames.has(name)
}

module.exports = { isExcludedFolder }
