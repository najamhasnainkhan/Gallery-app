const fs = require('fs')
const { execFile } = require('child_process')
const { promisify } = require('util')

const exec = promisify(execFile)
const typeNames = { 2: 'Removable drive', 3: 'Local drive', 4: 'Network drive' }

async function automaticDrives() {
  if (process.platform !== 'win32') return [{ path: process.cwd(), type: 'Development folder', available: true }]
  try {
    const command = 'Get-CimInstance Win32_LogicalDisk | Where-Object {$_.DriveType -in 2,3,4} | Select-Object DeviceID,DriveType | ConvertTo-Json -Compress'
    const { stdout } = await exec('powershell.exe', ['-NoProfile', '-Command', command], { windowsHide: true })
    const rows = JSON.parse(stdout || '[]')
    return (Array.isArray(rows) ? rows : [rows]).filter(Boolean).map(row => ({
      path: `${row.DeviceID}\\`, type: typeNames[row.DriveType] || 'Drive', available: fs.existsSync(`${row.DeviceID}\\`)
    }))
  } catch {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => `${letter}:\\`).filter(fs.existsSync).map(path => ({ path, type: 'Accessible drive', available: true }))
  }
}

async function discoverDrives() {
  if (process.env.MEDIA_SCAN_ROOTS) return process.env.MEDIA_SCAN_ROOTS.split(',').map(path => path.trim()).filter(Boolean).map(path => ({ path, type: 'Configured folder', available: fs.existsSync(path) }))
  return automaticDrives()
}

module.exports = { discoverDrives }
