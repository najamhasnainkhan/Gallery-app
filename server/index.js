const express = require('express')
const { GalleryScanner } = require('./scanner')
const { sendToRecycleBin } = require('./media-manager')

const app = express()
const scanner = new GalleryScanner()
app.use(express.json())

app.get('/api/library', (_req, res) => res.json(scanner.snapshot()))
app.get('/api/media/:id/file', (req, res) => {
  const item = scanner.find(req.params.id)
  if (!item || !item.available) return res.status(404).json({ error: 'This media is unavailable because its source drive is disconnected.' })
  res.sendFile(item.path, error => {
    if (error && !res.headersSent) res.status(error.statusCode || 404).end()
  })
})

app.delete('/api/media/:id', async (req, res) => {
  const item = scanner.find(req.params.id)
  if (!item) return res.status(404).json({ error: 'Media item is not available.' })
  if (!item.available) return res.status(409).json({ error: 'This media is unavailable because its source drive is disconnected.' })
  try {
    await sendToRecycleBin(item.path)
    scanner.remove(item.id)
    res.json({ message: `${item.name} was moved to the Windows Recycle Bin.` })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Could not move this file to the Recycle Bin.' })
  }
})

app.post('/api/media/:id/move', async (req, res) => {
  try {
    const existing = scanner.find(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Media item is not available.' })
    if (!existing.available) return res.status(409).json({ error: 'This media is unavailable because its source drive is disconnected.' })
    const item = await scanner.move(req.params.id, req.body?.destinationFolder)
    if (!item) return res.status(404).json({ error: 'Media item is not available.' })
    res.json({ item, message: `Moved ${item.name}.` })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Could not move this file.' })
  }
})

const port = Number(process.env.API_PORT) || 3001
app.listen(port, () => {
  console.log(`Gallery scanner API listening on ${port}`)
  scanner.start()
})
