import { Bot, Knowledge } from '../types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import saveAs from 'file-saver';


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

export const updateBot = async (id: string, updates: Partial<Omit<Bot, 'id' | 'created_at' | 'admin_pass'>>): Promise<Bot> => {
    const db = await openDB();
    const botToUpdate = await getBot(id);
    if (!botToUpdate) {
        throw new Error(`Bot with id ${id} not found.`);
    }

    const updatedBot: Bot = {
        ...botToUpdate,
        ...updates,
        id: botToUpdate.id,
        created_at: botToUpdate.created_at,
        admin_pass: botToUpdate.admin_pass,
        updated_at: new Date().toISOString(),
    };
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BOT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(BOT_STORE_NAME);
        store.put(updatedBot);
        
        transaction.oncomplete = () => resolve(updatedBot);
        transaction.onerror = () => {
            console.error("Update bot transaction error", transaction.error);
            reject(new Error('Failed to update bot. Transaction failed.'));
        };
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
    return updateBot(id, { knowledge });
};

export const backupDatabase = async (): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(BOT_STORE_NAME, 'readonly');
    const store = transaction.objectStore(BOT_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onerror = () => reject(new Error('Failed to read data for backup.'));
        request.onsuccess = async () => {
            const bots: Bot[] = request.result;
            if (!bots || bots.length === 0) {
                alert("No bots to back up.");
                return resolve();
            }
            try {
                const docChildren: Paragraph[] = [
                    new Paragraph({
                        heading: HeadingLevel.TITLE,
                        text: "Lord of the Chatbot - All Bots Backup",
                        alignment: 'center',
                    }),
                    new Paragraph({ text: `Backup generated on: ${new Date().toLocaleString()}`, alignment: 'center' }),
                    new Paragraph({ text: "" }) // Spacer
                ];

                bots.forEach((bot, index) => {
                    docChildren.push(
                        new Paragraph({
                            heading: HeadingLevel.HEADING_1,
                            text: bot.name,
                            border: { bottom: { color: "auto", space: 1, style: "single", size: 6 } }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Bot ID: ", bold: true }),
                                new TextRun({ text: bot.id, style: 'Hyperlink' }) // Using a style to make it look like code
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Welcome Message: ", bold: true }),
                                new TextRun({ text: bot.welcome_message })
                            ]
                        }),
                        new Paragraph({ text: "" }), // Spacer
                        new Paragraph({
                            heading: HeadingLevel.HEADING_2,
                            text: "Knowledge Base"
                        })
                    );

                    if (bot.knowledge && (bot.knowledge.files.length > 0 || bot.knowledge.texts.length > 0)) {
                        if (bot.knowledge.files.length > 0) {
                            docChildren.push(new Paragraph({ heading: HeadingLevel.HEADING_3, text: "Source File Names" }));
                            bot.knowledge.files.forEach(file => {
                                docChildren.push(new Paragraph({ text: file, bullet: { level: 0 } }));
                            });
                             docChildren.push(new Paragraph({ text: "" }));
                        }

                        const allTexts = bot.knowledge.texts;
                        if (allTexts.length > 0) {
                             docChildren.push(new Paragraph({ heading: HeadingLevel.HEADING_3, text: "Knowledge Content" }));
                             allTexts.forEach(text => {
                                docChildren.push(new Paragraph({ text, style: "wellSpaced" }));
                                docChildren.push(new Paragraph({ text: "" })); // Space between entries
                             });
                        }
                    } else {
                        docChildren.push(new Paragraph({ text: "No knowledge base items found for this bot.", style: "wellSpaced" }));
                    }
                    
                    if (index < bots.length - 1) {
                         docChildren.push(new Paragraph({ text: "", pageBreakBefore: true })); // Page break after each bot
                    }
                });

                const doc = new Document({
                    sections: [{
                        properties: {},
                        children: docChildren,
                    }],
                    styles: {
                        paragraphStyles: [
                            {
                                id: "wellSpaced",
                                name: "Well Spaced",
                                basedOn: "Normal",
                                next: "Normal",
                                run: { font: "Calibri", size: 22 }, // 11pt
                                paragraph: {
                                    spacing: { before: 100, after: 100 },
                                    indent: { left: 720 },
                                    border: {
                                        bottom: { color: "auto", space: 1, style: "single", size: 4 },
                                    },
                                },
                            },
                        ],
                    }
                });

                const blob = await Packer.toBlob(doc);
                saveAs(blob, `lord-of-the-chatbot_backup_${new Date().toISOString().split('T')[0]}.docx`);
                resolve();

            } catch (e) {
                console.error("Backup to DOCX failed:", e);
                reject(new Error(`Failed to create DOCX backup file: ${(e as Error).message}`));
            }
        };
    });
};