const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const exifr = require('exifr')
const { mediaKind } = require('./media-types')
const { watchLibrary } = require('./library-watcher')
const { discoverDrives } = require('./drive-discovery')
const { isExcludedFolder } = require('./scan-exclusions')

function driveFor(filePath, drives) {
  return drives.find(drive => filePath.toLowerCase().startsWith(drive.path.toLowerCase())) || { path: path.parse(filePath).root, type: 'Drive' }
}

function idFor(filePath) { return crypto.createHash('sha1').update(filePath).digest('hex').slice(0, 16) }

class GalleryScanner {
  constructor() {
    this.items = []
    this.status = 'Preparing scan'
    this.scanned = 0
    this.roots = []
    this.watcher = null
    this.updates = 0
  }

  snapshot() {
    this.refreshAvailability()
    return { status: this.status, scanned: this.scanned, roots: this.roots, items: this.items, watching: Boolean(this.watcher), updates: this.updates }
  }

  refreshAvailability() {
    let changed = false
    this.roots = this.roots.map(root => {
      const available = fs.existsSync(root.path)
      if (available !== root.available) changed = true
      return { ...root, available }
    })
    this.items = this.items.map(item => {
      const available = Boolean(driveFor(item.path, this.roots).available)
      if (available !== item.available) { changed = true; return { ...item, available } }
      return item
    })
    if (changed) this.updates += 1
  }

  find(id) { return this.items.find(item => item.id === id) }

  remove(id) {
    const before = this.items.length
    this.items = this.items.filter(item => item.id !== id)
    if (this.items.length !== before) this.updates += 1
  }

  async move(id, destinationFolder) {
    const item = this.find(id)
    if (!item) return null
    const { moveFile } = require('./media-manager')
    const movedPath = await moveFile(item.path, destinationFolder)
    this.remove(id)
    await this.indexFile(movedPath, item.kind)
    return this.find(idFor(movedPath))
  }

  async start() {
    this.roots = await discoverDrives()
    const accessible = this.roots.filter(root => root.available)
    this.status = accessible.length ? 'Scanning accessible storage' : 'No accessible storage found'
    if (!accessible.length) return
    for (const root of accessible) await this.walk(root.path)
    this.startWatching()
    this.status = 'Library is up to date'
  }

  startWatching() {
    if (this.watcher) return
    this.watcher = watchLibrary({
      roots: this.roots.filter(root => root.available).map(root => root.path),
      ignored: isExcludedFolder,
      onFile: (event, filePath) => this.handleWatchEvent(event, filePath)
    })
  }

  async handleWatchEvent(event, filePath) {
    const kind = mediaKind(filePath)
    if (!kind) return
    const id = idFor(filePath)
    if (event === 'unlink') {
      const before = this.items.length
      this.items = this.items.filter(item => item.id !== id)
      if (this.items.length !== before) this.updates += 1
      return
    }
    await this.indexFile(filePath, kind)
  }

  async walk(folder) {
    let entries
    try { entries = await fs.promises.readdir(folder, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      const fullPath = path.join(folder, entry.name)
      if (entry.isDirectory()) {
        if (!isExcludedFolder(fullPath)) await this.walk(fullPath)
        continue
      }
      if (!entry.isFile()) continue
      this.scanned += 1
      const kind = mediaKind(fullPath)
      if (!kind) continue
      await this.indexFile(fullPath, kind)
    }
  }

  async indexFile(filePath, kind = mediaKind(filePath)) {
    if (!kind) return
    try {
      const stat = await fs.promises.stat(filePath)
      let captureDate = null
      if (kind === 'photo') {
        try {
          const metadata = await exifr.parse(filePath, ['DateTimeOriginal', 'CreateDate'])
          const captured = metadata?.DateTimeOriginal || metadata?.CreateDate
          if (captured instanceof Date && !Number.isNaN(captured.valueOf())) captureDate = captured.toISOString()
        } catch { /* Unsupported or metadata-free images use modified time. */ }
      }
      const source = driveFor(filePath, this.roots)
      const item = { id: idFor(filePath), name: path.basename(filePath), path: filePath, kind, date: captureDate || stat.mtime.toISOString(), dateSource: captureDate ? 'capture' : 'modified', size: stat.size, sourcePath: source.path, sourceType: source.type, available: true }
      const index = this.items.findIndex(existing => existing.id === item.id)
      if (index >= 0) this.items[index] = item
      else this.items.push(item)
      this.items.sort((a, b) => new Date(b.date) - new Date(a.date))
      this.updates += 1
    } catch { /* Skip unavailable files and files still being written. */ }
  }
}

module.exports = { GalleryScanner }
