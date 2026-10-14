const key = 'windows-gallery-collections-v1'

export function loadCollections() {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    return {
      favorites: Array.isArray(saved?.favorites) ? saved.favorites : [],
      albums: Array.isArray(saved?.albums) ? saved.albums : []
    }
  } catch { return { favorites: [], albums: [] } }
}

export function saveCollections(collections) {
  localStorage.setItem(key, JSON.stringify(collections))
}
