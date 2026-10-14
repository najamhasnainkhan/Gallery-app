const photoExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'])
const videoExtensions = new Set(['.mp4', '.mov', '.avi', '.mkv', '.wmv'])

function mediaKind(filePath) {
  const extension = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
  if (photoExtensions.has(extension)) return 'photo'
  if (videoExtensions.has(extension)) return 'video'
  return null
}

module.exports = { mediaKind }
