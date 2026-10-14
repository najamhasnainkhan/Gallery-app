import { useEffect, useMemo, useState } from 'react'
import MediaViewer from './MediaViewer'
import { loadCollections, saveCollections } from './collections'

const formatDate = value => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))

function Tile({ item, favorite, onOpen, onFavorite }) {
  const url = `/api/media/${item.id}/file`
  return <article className={`tile ${item.available === false ? 'is-unavailable' : ''}`}>
    <button className="tile-open" onClick={() => item.available !== false && onOpen(item)} aria-label={item.available === false ? `${item.name} is unavailable` : `Open ${item.name}`} disabled={item.available === false}><div className="preview">
      {item.kind === 'photo' ? <img src={url} alt={item.name} loading="lazy" /> : <video src={url} preload="metadata" muted />}
      {item.kind === 'video' && <span className="video-badge">VIDEO</span>}{item.available === false ? <span className="unavailable-badge">DRIVE OFFLINE</span> : <span className="open-hint">{item.kind === 'video' ? 'Play' : 'View'}</span>
    </div><div className="tile-info"><strong title={item.name}>{item.name}</strong><span>{formatDate(item.date)}</span></div></button>
    <button className={`tile-favorite ${favorite ? 'is-favorite' : ''}`} onClick={() => onFavorite(item.id)} aria-label={favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}>♥</button>
  </article>
}

export default function App() {
  const [library, setLibrary] = useState({ status: 'Connecting to scanner', scanned: 0, roots: [], items: [] })
  const [collections, setCollections] = useState(loadCollections)
  const [view, setView] = useState('all'), [selectedId, setSelectedId] = useState(null), [failed, setFailed] = useState(false), [message, setMessage] = useState('')
  const [albumName, setAlbumName] = useState('')
  useEffect(() => saveCollections(collections), [collections])
  const refresh = async () => { const response = await fetch('/api/library'); if (!response.ok) throw Error(); setLibrary(await response.json()) }
  useEffect(() => { const load = () => refresh().then(() => setFailed(false)).catch(() => setFailed(true)); load(); const timer = setInterval(load, 1600); return () => clearInterval(timer) }, [])
  const currentAlbum = view.startsWith('album:') ? collections.albums.find(a => a.id === view.slice(6)) : null
  const visibleItems = useMemo(() => library.items.filter(item => view === 'all' || (view === 'favorites' && collections.favorites.includes(item.id)) || (currentAlbum && currentAlbum.itemIds.includes(item.id))), [library.items, view, collections, currentAlbum])
  const selectedIndex = visibleItems.findIndex(item => item.id === selectedId), selectedItem = selectedIndex >= 0 ? visibleItems[selectedIndex] : null
  const updateCollections = updater => setCollections(current => updater(current))
  const toggleFavorite = id => updateCollections(c => ({ ...c, favorites: c.favorites.includes(id) ? c.favorites.filter(x => x !== id) : [...c.favorites, id] }))
  const createAlbum = event => { event.preventDefault(); const name = albumName.trim(); if (!name) return; const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`; updateCollections(c => ({ ...c, albums: [...c.albums, { id, name, itemIds: [] }] })); setAlbumName(''); setView(`album:${id}`) }
  const addToAlbum = (albumId, id) => updateCollections(c => ({ ...c, albums: c.albums.map(a => a.id === albumId && !a.itemIds.includes(id) ? { ...a, itemIds: [...a.itemIds, id] } : a) }))
  const removeFromAlbum = (albumId, id) => updateCollections(c => ({ ...c, albums: c.albums.map(a => a.id === albumId ? { ...a, itemIds: a.itemIds.filter(x => x !== id) } : a) }))
  const deleteAlbum = id => { updateCollections(c => ({ ...c, albums: c.albums.filter(a => a.id !== id) })); setView('all') }
  const fileChanged = text => { setMessage(text); setSelectedId(null); refresh().catch(() => setFailed(true)) }
  const isScanning = !failed && library.status === 'Scanning accessible storage'
  const unavailableCount = library.items.filter(item => item.available === false).length
  const driveSummary = library.roots.map(root => `${root.path} · ${root.type}${root.available ? '' : ' · offline'}`).join('  |  ')
  const title = view === 'all' ? 'All media' : view === 'favorites' ? 'Favorites' : currentAlbum?.name || 'Album'
  return <main><header><div><p className="eyebrow">YOUR PC, IN ONE PLACE</p><h1>Gallery</h1></div><div className="scan"><span className={`pulse ${isScanning ? '' : 'pulse-calm'}`} />{failed ? 'Scanner is unavailable' : isScanning ? 'Scanning your library — browse as we find media' : library.watching ? 'Watching your library for changes' : library.status}<small>{library.items.length} media items · {library.scanned.toLocaleString()} files checked{unavailableCount ? ` · ${unavailableCount} unavailable` : ''}</small></div></header>
    <div className="library-layout"><aside className="collections"><button className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>▦ All media <span>{library.items.length}</span></button><button className={view === 'favorites' ? 'active' : ''} onClick={() => setView('favorites')}>♥ Favorites <span>{collections.favorites.length}</span></button><div className="albums-heading">ALBUMS</div>{collections.albums.map(album => <div className="album-row" key={album.id}><button className={view === `album:${album.id}` ? 'active' : ''} onClick={() => setView(`album:${album.id}`)}>□ {album.name}<span>{album.itemIds.length}</span></button><button className="delete-album" onClick={() => deleteAlbum(album.id)} aria-label={`Delete ${album.name}`}>×</button></div>)}<form className="new-album" onSubmit={createAlbum}><input value={albumName} onChange={e => setAlbumName(e.target.value)} placeholder="New album name" aria-label="New album name"/><button>Create</button></form></aside>
    <div className="gallery-content"><section className="intro"><div><h2>{title}</h2><p>{view === 'all' ? 'Newest first · Capture date when available.' : 'Virtual collection · original files stay in place.'}</p></div>{currentAlbum && <button className="small-button" onClick={() => deleteAlbum(currentAlbum.id)}>Delete album</button>}</section>{message && <div className="toast" role="status">{message}<button onClick={() => setMessage('')} aria-label="Dismiss message">×</button></div>}{visibleItems.length ? <section className="grid">{visibleItems.map(item => <Tile key={item.id} item={item} favorite={collections.favorites.includes(item.id)} onFavorite={toggleFavorite} onOpen={x => setSelectedId(x.id)} />)}</section> : <section className="empty"><div className="empty-icon">▧</div><h2>{failed ? 'Start the gallery server' : `No media in ${title}`}</h2><p>{failed ? 'Run npm run dev, then reload this page.' : view === 'all' ? 'Media will appear here as the scanner discovers it.' : 'Open media from All media, then add it to this collection.'}</p></section>}</div></div><footer>Albums and favorites are virtual — files are never copied or moved · {driveSummary || 'accessible locations'} </footer>
    {selectedItem && <MediaViewer item={selectedItem} index={selectedIndex} total={visibleItems.length} albums={collections.albums} favorite={collections.favorites.includes(selectedItem.id)} activeAlbum={currentAlbum} onFavorite={() => toggleFavorite(selectedItem.id)} onAddToAlbum={id => addToAlbum(id, selectedItem.id)} onRemoveFromAlbum={() => removeFromAlbum(currentAlbum.id, selectedItem.id)} onClose={() => setSelectedId(null)} onPrevious={() => setSelectedId(visibleItems[selectedIndex - 1]?.id)} onNext={() => setSelectedId(visibleItems[selectedIndex + 1]?.id)} onDeleted={fileChanged} onMoved={fileChanged} />}</main>
}
