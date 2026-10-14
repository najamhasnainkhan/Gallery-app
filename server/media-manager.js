const fs = require('fs')
const path = require('path')

async function sendToRecycleBin(filePath) {
  if (process.platform !== 'win32') {
    const error = new Error('Recycle Bin deletion is available only when the gallery server runs on Windows.')
    error.status = 501
    throw error
  }
  const module = await import('trash')
  await module.default(filePath)
}

async function moveFile(filePath, destinationFolder) {
  if (!destinationFolder || typeof destinationFolder !== 'string') {
    const error = new Error('Choose a destination folder.')
    error.status = 400
    throw error
  }
  const folder = path.resolve(destinationFolder.trim())
  let folderStat
  try { folderStat = await fs.promises.stat(folder) } catch {
    const error = new Error('That destination folder is not accessible.')
    error.status = 400
    throw error
  }
  if (!folderStat.isDirectory()) {
    const error = new Error('The destination must be a folder.')
    error.status = 400
    throw error
  }
  const targetPath = path.join(folder, path.basename(filePath))
  if (path.resolve(targetPath) === path.resolve(filePath)) {
    const error = new Error('This file is already in that folder.')
    error.status = 400
    throw error
  }
  if (fs.existsSync(targetPath)) {
    const error = new Error('A file with that name already exists in the destination.')
    error.status = 409
    throw error
  }
  try {
    await fs.promises.rename(filePath, targetPath)
  } catch (error) {
    if (error.code !== 'EXDEV') throw error
    await fs.promises.copyFile(filePath, targetPath, fs.constants.COPYFILE_EXCL)
    await fs.promises.unlink(filePath)
  }
  return targetPath
}

module.exports = { sendToRecycleBin, moveFile }
