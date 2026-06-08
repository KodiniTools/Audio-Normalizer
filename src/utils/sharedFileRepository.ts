/**
 * Shared File Repository – IndexedDB bridge between KodiniTools apps.
 *
 * The converter writes converted audio blobs here; receiving tools
 * (Visualizer, Normalisierer, Equalizer) read from the same store
 * when opened with ?source=audiokonverter.
 */

import type { SharedFileRecord } from '../types'

const DB_NAME = 'kodinitools-shared-files'
const STORE_NAME = 'audio-files'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function shareFiles(files: { name: string; blob: Blob }[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  store.clear()

  for (const file of files) {
    store.put({
      name: file.name,
      blob: file.blob,
      mimeType: file.blob.type,
      source: 'audiokonverter',
      sharedAt: Date.now(),
    })
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function getSharedFiles(): Promise<SharedFileRecord[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const request = tx.objectStore(STORE_NAME).getAll()

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close()
      resolve(request.result as SharedFileRecord[])
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

export async function clearSharedFiles(): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}
