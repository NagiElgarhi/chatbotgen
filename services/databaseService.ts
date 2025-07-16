import { Bot, Knowledge } from '../types';

const DB_NAME = 'LordOfTheChatbotDB';
const DB_VERSION = 1;
const BOT_STORE_NAME = 'bots';

// --- DB Helper ---
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(new Error('IndexedDB could not be opened. It might be blocked or unavailable in this browser.'));
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(BOT_STORE_NAME)) {
                db.createObjectStore(BOT_STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

// --- Helper Functions ---
const generateId = () => `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateAdminPass = () => Math.random().toString(36).substr(2, 6).toUpperCase();

// --- API Functions for Bots ---

export const getBots = async (): Promise<Omit<Bot, 'knowledge'>[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BOT_STORE_NAME, 'readonly');
        const store = transaction.objectStore(BOT_STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(new Error('Failed to fetch bots from IndexedDB.'));
        request.onsuccess = () => {
            const bots: Bot[] = request.result;
            const botsWithoutKnowledge = bots.map(({ knowledge, ...rest }) => rest);
            resolve(botsWithoutKnowledge.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
        };
    });
};

export const getBot = async (id: string): Promise<Bot | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BOT_STORE_NAME, 'readonly');
        const store = transaction.objectStore(BOT_STORE_NAME);
        const request = store.get(id);

        request.onerror = () => reject(new Error(`Failed to fetch bot with id: ${id}`));
        request.onsuccess = () => resolve(request.result || null);
    });
};

export const createBot = async (botData: Partial<Bot>): Promise<Bot> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        const newBot: Bot = {
            id: generateId(),
            admin_pass: generateAdminPass(),
            name: botData.name || 'New Bot',
            welcome_message: botData.welcome_message || 'Hello!',
            knowledge: botData.knowledge || { texts: [], files: [] },
            created_at: now,
            updated_at: now,
            image_base64: botData.image_base64 || null,
            wavy_color: botData.wavy_color || null,
        };

        const transaction = db.transaction(BOT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(BOT_STORE_NAME);
        store.add(newBot);
        
        transaction.oncomplete = () => resolve(newBot);
        transaction.onerror = () => reject(new Error('Failed to create bot. Transaction failed.'));
    });
};

export const deleteBot = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BOT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(BOT_STORE_NAME);
        store.delete(id);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Failed to delete bot. Transaction failed.'));
    });
};

export const updateBotKnowledge = async (id: string, knowledge: Knowledge): Promise<Bot> => {
    const db = await openDB();
    const botToUpdate = await getBot(id);
    if (!botToUpdate) {
        throw new Error(`Bot with id ${id} not found.`);
    }

    const updatedBot: Bot = {
        ...botToUpdate,
        knowledge,
        updated_at: new Date().toISOString(),
    };
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BOT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(BOT_STORE_NAME);
        store.put(updatedBot);
        
        transaction.oncomplete = () => resolve(updatedBot);
        transaction.onerror = () => reject(new Error('Failed to update bot knowledge. Transaction failed.'));
    });
};

export const backupDatabase = async (): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(BOT_STORE_NAME, 'readonly');
    const store = transaction.objectStore(BOT_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onerror = () => reject(new Error('Failed to read data for backup.'));
        request.onsuccess = () => {
             const data = request.result;
            if (!data || data.length === 0) {
                alert("No bots to back up.");
                return resolve();
            }
            try {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lord-of-the-chatbot_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                resolve();
            } catch (e) {
                console.error("Backup failed:", e);
                reject(new Error('Failed to create backup file.'));
            }
        };
    });
};