

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Bot, Knowledge } from '../types';
import { getBots, createBot, deleteBot, updateBot, backupDatabase, getBot } from '../services/databaseService';
import { PlusIcon, TrashIcon, CodeIcon, ClipboardIcon, CheckIcon, UploadIcon, ChevronLeftIcon, SpinnerIcon, CheckCircleIcon, DownloadIcon, DocumentTextIcon, PlatformLogoIcon, CogIcon, ArrowRightIcon, XIcon, BrainIcon } from '../components/Icons';
import { colorOptions } from '../utils/colors';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import saveAs from 'file-saver';

// --- Worker setup for PDF parsing ---
// The dynamic URL constructor was failing. Pointing directly to the CDN-hosted worker script is more robust.
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@5.3.93/build/pdf.worker.mjs';


const AdminPage: React.FC = () => {
    const [bots, setBots] = useState<Omit<Bot, 'knowledge'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [error, setError] = useState<string | null>(null);

    const loadBots = useCallback(async () => {
        try {
            setIsLoading(true);
            const fetchedBots = await getBots();
            setBots(fetchedBots);
        } catch (err) {
            console.error("Failed to load bots:", err);
            setError("Could not load bots. Please ensure IndexedDB is available and not blocked.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBots();
    }, [loadBots]);

    const handleCreateBot = async () => {
        try {
            const newBot = await createBot({ name: 'New Bot', welcome_message: 'How can I assist you today?' });
            await loadBots();
            handleSelectBot(newBot.id);
        } catch (err) {
            console.error("Failed to create bot:", err);
            setError("Failed to create a new bot.");
        }
    };
    
    const handleDeleteBot = async (id: string) => {
        if (window.confirm('Are you sure you want to permanently delete this bot and all its knowledge?')) {
            try {
                await deleteBot(id);
                await loadBots();
                if (selectedBot?.id === id) {
                    setSelectedBot(null);
                    setView('list');
                }
            } catch (err) {
                console.error("Failed to delete bot:", err);
                setError("Failed to delete the bot.");
            }
        }
    };

    const handleSelectBot = async (id: string) => {
        try {
            setIsLoading(true);
            const fullBot = await getBot(id);
            if(fullBot) {
                setSelectedBot(fullBot);
                setView('edit');
            } else {
                 throw new Error("Bot not found");
            }
        } catch(err) {
            console.error(`Failed to fetch bot ${id}:`, err);
            setError(`Could not load details for bot ${id}.`);
            setView('list');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpdateBot = (updatedBot: Bot) => {
        setSelectedBot(updatedBot);
        setBots(prev => prev.map(b => b.id === updatedBot.id ? { ...b, name: updatedBot.name, updated_at: updatedBot.updated_at } : b));
    };

    const handleBackup = async () => {
        try {
            await backupDatabase();
            alert("Database backup successful!");
        } catch (err) {
            console.error("Backup failed:", err);
            alert(`Backup failed: ${(err as Error).message}`);
        }
    };

    return (
        <div className="min-h-screen bg-stone-100 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <PlatformLogoIcon className="h-12 w-12"/>
                        <div>
                           <h1 className="text-4xl font-cinzel font-bold text-amber-900">Bot Management Council</h1>
                           <p className="text-stone-600">Forge and command your legion of AI assistants.</p>
                        </div>
                    </div>
                    {view === 'edit' && (
                         <button onClick={() => setView('list')} className="flex items-center gap-2 px-4 py-2 bg-stone-200 text-stone-800 font-semibold rounded-lg hover:bg-stone-300 transition-colors">
                            <ChevronLeftIcon className="w-5 h-5"/>
                            Back to List
                        </button>
                    )}
                </header>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}

                {isLoading && (
                    <div className="flex justify-center items-center py-16">
                        <SpinnerIcon className="w-12 h-12 text-amber-700"/>
                    </div>
                )}
                
                {!isLoading && view === 'list' && (
                    <BotList 
                        bots={bots}
                        onCreate={handleCreateBot}
                        onEdit={handleSelectBot}
                        onDelete={handleDeleteBot}
                        onBackup={handleBackup}
                    />
                )}
                
                {!isLoading && view === 'edit' && selectedBot && (
                    <BotEditor
                        key={selectedBot.id} // Re-mount component when bot changes
                        bot={selectedBot}
                        onBotUpdate={handleUpdateBot}
                    />
                )}
            </div>
        </div>
    );
};


// =================================================================================
// Bot List View
// =================================================================================
interface BotListProps {
    bots: Omit<Bot, 'knowledge'>[];
    onCreate: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onBackup: () => void;
}
const BotList: React.FC<BotListProps> = ({ bots, onCreate, onEdit, onDelete, onBackup }) => (
     <div className="bg-white/60 p-6 rounded-xl shadow-lg border border-amber-200">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-cinzel text-stone-800">Your Bots</h2>
            <div className="flex gap-2">
                 <button onClick={onBackup} className="px-4 py-2 bg-stone-600 text-white font-bold rounded-md hover:bg-stone-700 transition-colors flex items-center justify-center gap-2">
                    <DownloadIcon className="w-5 h-5"/>
                    <span>Backup All</span>
                </button>
                <button onClick={onCreate} className="px-4 py-2 bg-amber-600 text-white font-bold rounded-md hover:bg-amber-700 transition-colors flex items-center justify-center gap-2">
                    <PlusIcon className="w-5 h-5"/>
                    <span>Create New Bot</span>
                </button>
            </div>
        </div>

        {bots.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-stone-300 rounded-lg">
                <p className="text-stone-500">No bots found. Create your first one to get started!</p>
            </div>
        ) : (
            <div className="space-y-4">
                {bots.map(bot => (
                    <div key={bot.id} className="bg-simple-gold-gradient p-4 rounded-lg shadow-md flex items-center justify-between transition-all hover:shadow-lg hover:scale-[1.01]">
                        <div className="flex items-center gap-4">
                            <img src={bot.image_base64 || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2M1YTMyYyI+PHBhdGggZD0iTTE5IDEzYy41NTIzIDAgMSAuNDQ3NyAxIDEtLjAwMzMgMS45MzIxLS43ODY1IDMuNzIyNi0yLjE1NzUgNS4wOTM1cy0zLjE2MTQgMi4xNTQyLTUuMDk0IDIuMTU3NWMtLjU1MjMgMC0xLS40NDc3LTEtMXMuNDQ3Ny0xIDEtMWMxLjM4MzQgMCAyLjY2ODYtLjU2MTYgMy42MDY2LTEuNDk5NlMxNSA4LjM4MzQgMTUgN2MwLS41NTIzLjQ0NzctMSAxLTFzMSAuNDQ3NyAxIDFWNWMwIC4zNTU5LS4wOTUgLjcwNjEtLjI3MzMgMS4wMTM3LS40MDExLjY5MzktMS4wMzcgMS4yMDM0LTEuNzkyMyAxLjQ3OTEtMS4wMjI0LjM4NDItMi4xMzUzLjM4NDItMy4xNTc3IDAtLjc1NTYtLjI3NTctMS4zOTEyLS43ODUyLTEuNzkyMy0xLjQ3OTFDOS4wOTUgNS43MDYxIDkgNS4zNTU5IDkgNVY0YzAgLS41NTIzLjQ0NzctMSAxLTFzMSAuNDQ3NyAxIDF2LjVhMiAyIDAgMCAwIDQgMHYtLjV6bS04IDBjLS41NTIzIDAtMS0uNDQ3Ny0xLTFzLjQ0NzctMSAxLTFoLjVjMS45MzMyLS4wMDMzIDMuNzIyNi43ODY1IDUuMDk0IDIuMTU3NVMxNy45OTY3IDE2LjA2NzkgMTggMThjMCAuNTUyMy0uNDQ3NyAxLTEgMXMtMS0uNDQ3Ny0xLTFjMC0xLjM4MzQtLjU2MTYtMi42Njg2LTEuNDk5Ni0zLjYwNjZTMxMS4zODM0IDEyIDEwIDEySDl6bS00IDRjLS41NTIzIDAtMS0uNDQ3Ny0xLTFzLjQ0NzctMSAxLTFjMS45MzMyLS4wMDMzIDMuNzIyNi43ODY1IDUuMDk0IDIuMTU3NVMxMi45OTY3IDIwLjA2NzkgMTMgMjJjMCAuNTUyMy0uNDQ3NyAxLTEgMXMtMS0uNDQ3Ny0xLTFjLS4wMDMzLTEuMzgzNC0uNTY1EtMi42Njg2LTEuNDk5OC0zLjYwNjZzLTIuMjIzMi0xLjQ5NjMtMy42MDYyLTEuNDk5NnoiLz48L3N2Zz4='} alt="bot" className="w-12 h-12 rounded-full object-cover bg-white/50 border-2 border-amber-800/50" />
                            <div>
                                <p className="font-bold text-lg text-stone-900">{bot.name}</p>
                                <p className="text-xs text-stone-700 font-mono select-all">{bot.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => onEdit(bot.id)} className="p-2 bg-white/30 rounded-full text-stone-800 hover:bg-white/60 transition-colors" aria-label="Edit"><CogIcon className="w-6 h-6"/></button>
                            <button onClick={() => onDelete(bot.id)} className="p-2 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors" aria-label="Delete"><TrashIcon className="w-6 h-6"/></button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);


// =================================================================================
// Bot Editor View
// =================================================================================
interface BotEditorProps {
    bot: Bot;
    onBotUpdate: (bot: Bot) => void;
}
const BotEditor: React.FC<BotEditorProps> = ({ bot: initialBot, onBotUpdate }) => {
    const [bot, setBot] = useState<Bot>(initialBot);
    const [activeTab, setActiveTab] = useState<'settings' | 'knowledge' | 'deploy'>('settings');

    const handleUpdate = async (updates: Partial<Bot>) => {
        try {
            const updatedBot = await updateBot(bot.id, updates);
            setBot(updatedBot);
            onBotUpdate(updatedBot);
            return updatedBot;
        } catch(err) {
            console.error("Failed to update bot:", err);
            alert("Failed to save changes.");
            return null;
        }
    };
    
    return (
        <div className="bg-white/60 rounded-xl shadow-lg border border-amber-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-simple-gold-gradient">
                <h2 className="text-2xl font-bold font-cinzel text-stone-800">{bot.name}</h2>
                <div className="flex border border-amber-800/30 rounded-lg overflow-hidden bg-black/5 text-sm font-semibold">
                    <button onClick={() => setActiveTab('settings')} className={`px-4 py-1.5 transition-colors ${activeTab === 'settings' ? 'bg-amber-600 text-white' : 'hover:bg-amber-100'}`}>Settings</button>
                    <button onClick={() => setActiveTab('knowledge')} className={`px-4 py-1.5 transition-colors border-l border-r border-amber-800/30 ${activeTab === 'knowledge' ? 'bg-amber-600 text-white' : 'hover:bg-amber-100'}`}>Knowledge</button>
                    <button onClick={() => setActiveTab('deploy')} className={`px-4 py-1.5 transition-colors ${activeTab === 'deploy' ? 'bg-amber-600 text-white' : 'hover:bg-amber-100'}`}>Deploy</button>
                </div>
            </div>

            <div className="p-6">
                {activeTab === 'settings' && <SettingsTab bot={bot} onSave={handleUpdate} />}
                {activeTab === 'knowledge' && <KnowledgeTab bot={bot} onSave={handleUpdate} />}
                {activeTab === 'deploy' && <DeployTab bot={bot} />}
            </div>
        </div>
    );
};


// --- Editor Tabs ---

const SettingsTab: React.FC<{ bot: Bot, onSave: (updates: Partial<Bot>) => void }> = ({ bot, onSave }) => {
    const [name, setName] = useState(bot.name);
    const [welcomeMessage, setWelcomeMessage] = useState(bot.welcome_message);
    const [image, setImage] = useState(bot.image_base64);
    const [wavyColor, setWavyColor] = useState(bot.wavy_color || colorOptions[0].value);
    const [isSaving, setIsSaving] = useState(false);
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave({ name, welcome_message: welcomeMessage, image_base64: image, wavy_color: wavyColor });
        setIsSaving(false);
        alert("Settings Saved!");
    };
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Bot Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500"/>
                </div>
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Welcome Message</label>
                    <input type="text" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500"/>
                </div>
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Bot Avatar Image</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"/>
                    {image && <img src={image} alt="preview" className="w-20 h-20 rounded-full mt-2 object-cover border-2 border-amber-300"/>}
                </div>
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Button Color Gradient</label>
                    <select value={wavyColor} onChange={e => setWavyColor(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500">
                        {colorOptions.map(c => <option key={c.name} value={c.value}>{c.name}</option>)}
                    </select>
                </div>
            </div>
             <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-amber-600 text-white font-bold rounded-md hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:bg-stone-400">
                {isSaving ? <SpinnerIcon className="w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5"/>}
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
        </div>
    );
};

const KnowledgeTab: React.FC<{ bot: Bot, onSave: (updates: Partial<Bot>) => Promise<Bot | null> }> = ({ bot, onSave }) => {
    const [knowledge, setKnowledge] = useState<Knowledge>(bot.knowledge || { texts: [], files: [] });
    const [newText, setNewText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        setIsProcessing(true);
        
        let newTexts: string[] = [];
        let newFileNames: string[] = [...knowledge.files];

        for (const file of files) {
            if(newFileNames.includes(file.name)) continue;

            let textContent = '';
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContentProxy = await page.getTextContent();
                    textContent += textContentProxy.items.map(item => ('str' in item) ? item.str : '').join(' ') + '\n\n';
                }
            } else if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                textContent = result.value;
            } else if (file.type === 'text/plain') {
                 textContent = await file.text();
            }

            if (textContent) {
                newTexts.push(`--- Start of content from ${file.name} ---\n\n${textContent}\n\n--- End of content from ${file.name} ---`);
                newFileNames.push(file.name);
            }
        }
        
        const updatedKnowledge = {
            texts: [...knowledge.texts, ...newTexts],
            files: newFileNames,
        };
        const updatedBot = await onSave({ knowledge: updatedKnowledge });
        if(updatedBot?.knowledge) setKnowledge(updatedBot.knowledge);

        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
    };

    const addTextKnowledge = async () => {
        if (!newText.trim()) return;
        const updatedKnowledge = {
            ...knowledge,
            texts: [...knowledge.texts, newText.trim()],
        };
        const updatedBot = await onSave({ knowledge: updatedKnowledge });
        if(updatedBot?.knowledge) setKnowledge(updatedBot.knowledge);
        setNewText('');
    };

    const deleteTextKnowledge = async (index: number) => {
        const updatedTexts = knowledge.texts.filter((_, i) => i !== index);
        const updatedKnowledge = { ...knowledge, texts: updatedTexts };
        const updatedBot = await onSave({ knowledge: updatedKnowledge });
        if(updatedBot?.knowledge) setKnowledge(updatedBot.knowledge);
    };

    const deleteFileKnowledge = async (fileName: string) => {
        const updatedFiles = knowledge.files.filter(f => f !== fileName);
        const updatedTexts = knowledge.texts.filter(t => !(t.includes(`--- Start of content from ${fileName} ---`) && t.includes(`--- End of content from ${fileName} ---`)));
        const updatedKnowledge = { texts: updatedTexts, files: updatedFiles };
        const updatedBot = await onSave({ knowledge: updatedKnowledge });
        if(updatedBot?.knowledge) setKnowledge(updatedBot.knowledge);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Add Plain Text</label>
                <textarea value={newText} onChange={e => setNewText(e.target.value)} rows={4} className="w-full px-3 py-2 bg-white border-2 border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500" placeholder="Paste or type knowledge here..."></textarea>
                <button onClick={addTextKnowledge} className="mt-2 px-4 py-2 bg-amber-600 text-white font-bold rounded-md hover:bg-amber-700 transition-colors flex items-center gap-2"><PlusIcon/> Add Text</button>
            </div>
             <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Upload Documents (.pdf, .docx, .txt)</label>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.txt" className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"/>
                {isProcessing && <div className="flex items-center gap-2 mt-2 text-amber-800"><SpinnerIcon className="w-5 h-5"/> Processing files...</div>}
            </div>
            <div>
                <h4 className="text-lg font-bold text-stone-800 mb-2">Knowledge Items ({knowledge.files.length} Files, {knowledge.texts.length - knowledge.files.length} Texts)</h4>
                <div className="max-h-80 overflow-y-auto space-y-2 p-3 bg-stone-50 border border-stone-200 rounded-lg wavy-gold-scrollbar">
                    {knowledge.files.map((file, i) => (
                        <div key={`file-${i}`} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                            <span className="flex items-center gap-2 text-stone-700"><DocumentTextIcon className="w-5 h-5"/> {file}</span>
                            <button onClick={() => deleteFileKnowledge(file)} className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    ))}
                    {knowledge.texts.filter(t => !t.startsWith('--- Start of content from')).map((text, i) => (
                        <div key={`text-${i}`} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                            <p className="text-stone-700 truncate text-sm italic">"{text}"</p>
                            <button onClick={() => deleteTextKnowledge(knowledge.texts.findIndex(t => t === text))} className="p-1 text-red-500 hover:text-red-700 flex-shrink-0 ml-4"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    ))}
                    {knowledge.files.length === 0 && knowledge.texts.length === 0 && <p className="text-stone-400 text-center p-4">No knowledge base yet.</p>}
                </div>
            </div>
        </div>
    );
};

const DeployTab: React.FC<{ bot: Bot }> = ({ bot }) => {
    const [copied, setCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const embedCode = `<script src="${window.location.origin}/index.js?botId=${bot.id}" defer></script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const zip = new JSZip();

            // 1. Create README.md
            const readmeContent = `# Standalone Chatbot Setup

Thank you for downloading your chatbot from Lord of the Chatbot! To get your chatbot running, you need to add your Google AI API key.

## Instructions

1.  **Get your API Key**: If you don't have one, get your key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Edit \`gemini-service.js\`**: Open the \`gemini-service.js\` file in this package.
3.  **Find the API Key placeholder**: Look for the line: \`const apiKey = 'YOUR_API_KEY_HERE';\`
4.  **Add your key**: Replace \`'YOUR_API_KEY_HERE'\` with your actual Google AI API key.
5.  **Save the file**.
6.  **Upload to your server**: Upload all files to your web server and open \`index.html\`.
`;
            zip.file("README.md", readmeContent);

            // 2. Create index.html
            const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${bot.name}</title>
    <style> body { margin: 0; background-color: #f0f0f0; } </style>
</head>
<body>
    <p>Loading Chatbot...</p>
    <script src="index.js?botId=${bot.id}" defer></script>
</body>
</html>`;
            zip.file("index.html", indexHtmlContent);

            // 3. Create index.js (This would be your main application bundle)
            // For this example, we'll assume the main `index.js` is what's loaded.
            // We need to fetch the content of our running `index.js`.
            const indexJsResponse = await fetch('/index.js');
            const indexJsContent = await indexJsResponse.text();
            zip.file("index.js", indexJsContent);

            // 4. Create a custom gemini-service.js with a placeholder
            const geminiServiceResponse = await fetch('/services/geminiService.ts');
            let geminiServiceContent = await geminiServiceResponse.text();

            // Replace environment variable logic with a simple placeholder constant
            geminiServiceContent = geminiServiceContent.replace(
                /let ai: GoogleGenAI \| null = null;.*?return ai;/s,
`const apiKey = 'YOUR_API_KEY_HERE';
let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (ai) return ai;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error("API Key not found. Please add your Google AI API Key to gemini-service.js.");
    }
    ai = new GoogleGenAI({ apiKey });
    return ai;
};`
            );
            // Convert TS to JS (simple regex replacements for this case)
            geminiServiceContent = geminiServiceContent
                .replace(/import .*? from '.*?';/g, '')
                .replace(/export const/g, 'const')
                .replace(/: [A-Z][a-zA-Z]+/g, ''); // Remove type annotations

            zip.file("gemini-service.js", geminiServiceContent);
            
            // 5. Package the bot data itself
            zip.file(`bot_data.json`, JSON.stringify(bot, null, 2));


            // Generate and download zip
            const blob = await zip.generateAsync({ type: 'blob' });
            saveAs(blob, `${bot.name.replace(/\s+/g, '_')}_standalone.zip`);

        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to package the bot for download.");
        } finally {
            setIsDownloading(false);
        }
    };


    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold font-cinzel text-amber-900 mb-2">Embed on a Website</h3>
                <p className="text-stone-600 mb-4">Copy and paste this snippet into your website's HTML before the closing <code>&lt;/body&gt;</code> tag. The bot will appear as a floating button.</p>
                <div className="bg-stone-800 rounded-lg p-4 flex items-center justify-between text-white">
                    <pre className="font-mono text-sm overflow-x-auto"><code>{embedCode}</code></pre>
                    <button onClick={handleCopy} className="p-2 rounded-lg bg-stone-600 hover:bg-stone-500 transition-colors">
                        {copied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <ClipboardIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>
             <div>
                <h3 className="text-xl font-bold font-cinzel text-amber-900 mb-2">Download Standalone Bot</h3>
                <p className="text-stone-600 mb-4">
                    Download a ZIP file containing all necessary files to run the bot on your own server.
                    After downloading, you **must** edit the <code>gemini-service.js</code> file to add your Google AI API key.
                    Instructions are included in the <code>README.md</code> file inside the ZIP.
                </p>
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-md hover:bg-amber-700 transition-colors flex items-center justify-center gap-3 disabled:bg-stone-400"
                >
                    {isDownloading ? <SpinnerIcon className="w-6 h-6"/> : <DownloadIcon className="w-6 h-6"/>}
                    <span>{isDownloading ? 'Packaging Bot...' : 'Download ZIP'}</span>
                </button>
            </div>
        </div>
    );
};


export default AdminPage;