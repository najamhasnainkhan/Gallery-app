const chokidar = require('chokidar')

function watchLibrary({ roots, ignored, onFile }) {
  const watcher = chokidar.watch(roots, {
    ignoreInitial: true,
    ignored,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
    ignorePermissionErrors: true,
    persistent: true
  })

  watcher.on('add', filePath => onFile('add', filePath))
  watcher.on('change', filePath => onFile('change', filePath))
  watcher.on('unlink', filePath => onFile('unlink', filePath))
  watcher.on('error', error => console.warn(`Library watch warning: ${error.message}`))
  return watcher
}

module.exports = { watchLibrary }
