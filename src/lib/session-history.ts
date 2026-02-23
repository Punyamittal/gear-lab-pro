/**
 * GearOpt X — Session History Module
 * IndexedDB-powered telemetry persistence.
 * Saves every simulation run for trend analysis.
 */

export interface SessionRecord {
    id: string;
    timestamp: number;
    accelTime: number;
    skidpadTime: number;
    autocrossTime: number;
    gears: number[];
    peakVelocity: number;
    peakG: number;
    mass: number;
    grip: number;
    fitness: number | null;
    optimizer: 'manual' | 'classical' | 'quantum' | 'swarm' | 'genetic';
}

const DB_NAME = 'GearOptX_Sessions';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('optimizer', 'optimizer', { unique: false });
            }
        };
    });
}

export async function saveSession(record: Omit<SessionRecord, 'id' | 'timestamp'>): Promise<string> {
    const db = await openDB();
    const id = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullRecord: SessionRecord = {
        ...record,
        id,
        timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(fullRecord);
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
}

export async function getAllSessions(): Promise<SessionRecord[]> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const request = index.getAll();
        request.onsuccess = () => resolve(request.result as SessionRecord[]);
        request.onerror = () => reject(request.error);
    });
}

export async function getRecentSessions(limit: number = 20): Promise<SessionRecord[]> {
    const all = await getAllSessions();
    return all.slice(-limit);
}

export async function clearHistory(): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export function formatSessionTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
