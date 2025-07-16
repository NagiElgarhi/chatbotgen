
import React, { useState, useCallback, useEffect } from 'react';
import { Bot, Knowledge } from '../types';
import { getBots, createBot, deleteBot, updateBotKnowledge, backupDatabase } from '../services/databaseService';
import { PlusIcon, TrashIcon, CodeIcon, ClipboardIcon, CheckIcon, UploadIcon, ChevronLeftIcon, SpinnerIcon, CheckCircleIcon, DownloadIcon, UserIcon, DocumentTextIcon } from '../components/Icons';
import { colorOptions } from '../utils/colors';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@5.3.93/build/pdf.worker.mjs`;

// --- Helper Components ---
const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string }> = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-auto ring-1 ring-amber-300" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-amber-800 mb-6 text-center">{title}</h2>
            {children}
        </div>
    </div>
);

const EmbedCodeModal: React.FC<{ botId: string; onClose: () => void }> = ({ botId, onClose }) => {
    const [copied, setCopied] = useState(false);
    const embedUrl = `${window.location.origin}${window.location.pathname}?botId=${botId}`;
    const embedCode = `<iframe src="${embedUrl}" width="450" height="750" style="border:none; border-radius: 1rem;" title="Lord of the Chatbot"></iframe>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Modal onClose={onClose} title="Embed Bot Code">
            <p className="text-lg mb-4 text-stone-700 text-center">
                Copy this iframe code and paste it into your website's HTML to display this bot.
            </p>
            <div className="bg-stone-800 text-stone-100 p-4 rounded-lg font-mono text-sm relative" dir="ltr">
                {embedCode}
                <button onClick={handleCopy} className="absolute top-2 right-2 p-2 rounded-md bg-stone-700 hover:bg-stone-600">
                    {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                </button>
            </div>
             <div className="text-center mt-8">
                <button onClick={onClose} className="px-10 py-3 bg-amber-600 text-white text-lg font-bold rounded-full hover:bg-amber-700 transition-colors">
                    Close
                </button>
            </div>
        </Modal>
    );
};

// --- Knowledge Management View ---
interface ProcessedFile { name: string; text: string; }
const KnowledgeManager: React.FC<{ bot: Bot; onBack: () => void }> = ({ bot, onBack }) => {
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [parsingFiles, setParsingFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    
    useEffect(() => {
        if (bot.knowledge?.files) {
            setProcessedFiles(bot.knowledge.files.map(name => ({name, text: '...'})));
        }
    }, [bot]);

    const extractTextFromLocalFile = async (file: File): Promise<string> => {
        const mimeType = file.type;
        const arrayBuffer = await file.arrayBuffer();

        if (mimeType === 'application/pdf') {
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                // @ts-ignore
                fullText += content.items.map(item => item.str).join(' ') + '\n';
            }
            return fullText;
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        }
        throw new Error(`File type ${mimeType} is not supported.`);
    };

     const processFile = useCallback(async (file: File) => {
        if (processedFiles.some(pf => pf.name === file.name) || parsingFiles.includes(file.name)) return;
        setParsingFiles(prev => [...prev, file.name]);
        try {
            const text = await extractTextFromLocalFile(file);
            setProcessedFiles(prev => [...prev.filter(pf => pf.text !== '...'), { name: file.name, text }]);
        } catch (error) {
            alert(`Error processing file ${file.name}: ${(error as Error).message}`);
        } finally {
            setParsingFiles(prev => prev.filter(name => name !== file.name));
        }
    }, [processedFiles, parsingFiles]);

    const handleFileSelection = (files: FileList | null) => files && Array.from(files).forEach(processFile);
    const handleRemoveFile = (fileName: string) => setProcessedFiles(prev => prev.filter(f => f.name !== fileName));
    
    const handleUpdateKnowledge = async () => {
        const texts = processedFiles.flatMap(f => f.text.split(/\n\s*\n+/).map(c => c.trim()).filter(c => c.length > 20));
        if (texts.length === 0) {
            alert('No valid content to save. Ensure files contain text.');
            return;
        }
        
        const newKnowledge: Knowledge = {
            texts,
            files: processedFiles.map(f => f.name),
        };

        setIsUploading(true);
        try {
            await updateBotKnowledge(bot.id, newKnowledge);
            alert("Knowledge base updated successfully!");
            onBack();
        } catch (error) {
            alert(`Failed to update knowledge base: ${(error as Error).message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-amber-800 hover:text-amber-600 font-semibold mb-6">
                <ChevronLeftIcon className="w-5 h-5"/>
                <span>Back to Bot List</span>
            </button>
            <h2 className="text-3xl font-bold text-black mb-1">Manage Knowledge for: <span className="text-amber-700">{bot.name}</span></h2>
            <p className="text-lg text-stone-700 mt-2 mb-8">Upload PDF and Word files to feed data to this bot.</p>

            {/* File Upload UI */}
             <div className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center p-10 border-2 border-dashed border-amber-600/30 bg-black/5 rounded-2xl">
                    <label htmlFor="file-upload" className="inline-flex items-center justify-center gap-4 px-8 py-4 text-xl font-bold rounded-full transition-all duration-300 transform hover:scale-105 bg-wavy-gold-button text-black shadow-lg cursor-pointer">
                        <UploadIcon className="h-8 w-8" /> <span>Choose Files</span>
                    </label>
                    <p className="text-sm text-stone-600 mt-3">(PDF and DOCX files are supported)</p>
                    <input id="file-upload" type="file" multiple className="hidden" onChange={(e) => handleFileSelection(e.target.files)} accept=".pdf,.docx" disabled={parsingFiles.length > 0 || isUploading} />
                </div>

                {parsingFiles.length > 0 && <div className="text-center text-stone-700 animate-pulse">Parsing: {parsingFiles.join(', ')}...</div>}

                {processedFiles.length > 0 && (
                    <div className="bg-black/5 p-4 rounded-lg border border-amber-600/20">
                        <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-amber-900"><DocumentTextIcon /><span>Processed Files</span></h3>
                        <div className="space-y-2">
                            {processedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-black/5 p-2 rounded-md text-stone-800 border border-amber-600/10">
                                    <p className="truncate pr-2 font-mono" title={file.name}>{file.name}</p>
                                    <button onClick={() => handleRemoveFile(file.name)} className="p-1 text-red-700 hover:bg-red-300/50 rounded-full" aria-label={`Remove ${file.name}`}><TrashIcon className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="text-center pt-4 border-t border-amber-600/20 mt-8">
                    <button onClick={handleUpdateKnowledge} className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 text-xl font-bold rounded-full transition-all bg-wavy-gold-button text-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={parsingFiles.length > 0 || processedFiles.length === 0 || isUploading}>
                        {isUploading ? <SpinnerIcon className="h-8 w-8" /> : <CheckCircleIcon className="h-8 w-8" />}
                        <span>{isUploading ? 'Saving...' : 'Save Knowledge Base'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminPage: React.FC = () => {
    const [view, setView] = useState<'list' | 'knowledge'>('list');
    const [bots, setBots] = useState<Omit<Bot, 'knowledge'>[]>([]);
    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBackingUp, setIsBackingUp] = useState(false);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
    
    const fetchBotsList = useCallback(async () => {
        setIsLoading(true);
        try {
            const botList = await getBots();
            setBots(botList);
        } catch (err) {
            setError('Failed to load the bot list. Make sure the backend server is running.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'list') {
             fetchBotsList();
        }
    }, [view, fetchBotsList]);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setImagePreview(null);
    };

    const handleCreateBot = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('botName') as string;
        const welcome_message = formData.get('welcomeMessage') as string;
        const initialKnowledgeText = formData.get('initialKnowledge') as string;
        const image_base64 = imagePreview;
        const wavy_color = formData.get('wavyColor') as string;

        if (!name || !welcome_message) {
            alert('Please fill in the bot name and welcome message.');
            return;
        }

        let initialKnowledge: Knowledge | undefined = undefined;
        if (initialKnowledgeText && initialKnowledgeText.trim()) {
            const texts = initialKnowledgeText.split(/\n\s*\n+/).map(t => t.trim()).filter(Boolean);
            if (texts.length > 0) {
                 initialKnowledge = { texts, files: [] };
            }
        }
        
        try {
            await createBot({ name, welcome_message, knowledge: initialKnowledge, image_base64, wavy_color });
            handleCloseCreateModal();
            fetchBotsList();
        } catch (err) {
            alert(`Failed to create bot: ${(err as Error).message}`);
        }
    };

    const handleDeleteBot = async (botId: string) => {
        if (window.confirm("Are you sure you want to delete this bot? This action cannot be undone.")) {
            try {
                await deleteBot(botId);
                fetchBotsList();
            } catch (err) {
                alert(`Failed to delete bot: ${(err as Error).message}`);
            }
        }
    };
    
    const handleManageKnowledge = (bot: Omit<Bot, 'knowledge'>) => {
        setSelectedBot(bot as Bot);
        setView('knowledge');
    };

    const handleShowEmbed = (bot: Omit<Bot, 'knowledge'>) => {
        setSelectedBot(bot as Bot);
        setIsEmbedModalOpen(true);
    };

    const handleBackup = async () => {
        if (isBackingUp) return;
        setIsBackingUp(true);
        try {
            await backupDatabase();
        } catch (err) {
            alert(`Failed to create backup: ${(err as Error).message}`);
        } finally {
            setIsBackingUp(false);
        }
    };

    if (isLoading && view === 'list') {
        return <div className="flex items-center justify-center min-h-screen bg-stone-50"><SpinnerIcon className="w-16 h-16 text-amber-700"/></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-600 bg-red-100 min-h-screen">{error}</div>;
    }
    
    if (view === 'knowledge' && selectedBot) {
        return (
             <div className="p-4 sm:p-8 my-4 bg-stone-50 min-h-screen">
                <KnowledgeManager bot={selectedBot} onBack={() => { setView('list'); setSelectedBot(null); }} />
             </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 my-4 bg-stone-50 min-h-screen">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-black font-cinzel">Lord of the Chatbot</h1>
                    <p className="text-lg text-stone-700 mt-2">
                        Create and manage your AI voice assistants.
                    </p>
                </div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <button
                        onClick={handleBackup}
                        disabled={isBackingUp}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-lg font-bold rounded-full transition-all transform hover:scale-105 bg-stone-100 text-amber-800 border-2 border-amber-600 shadow-md disabled:opacity-50 disabled:cursor-wait"
                        title="Download a backup of the database"
                    >
                        {isBackingUp ? <SpinnerIcon className="w-5 h-5" /> : <DownloadIcon className="w-5 h-5"/>}
                        <span className="hidden sm:inline">{isBackingUp ? "Working..." : "Backup"}</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 text-lg font-bold rounded-full transition-all transform hover:scale-105 bg-wavy-gold-button text-black shadow-lg"
                    >
                        <PlusIcon />
                        <span>New Bot</span>
                    </button>
                </div>
            </header>

            <div className="bg-white shadow-lg rounded-2xl overflow-hidden ring-1 ring-amber-200">
                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        <div className="grid grid-cols-12 text-sm font-bold text-amber-900 bg-amber-50 p-4 border-b border-amber-200 uppercase tracking-wider">
                            <div className="col-span-4">Bot Name</div>
                            <div className="col-span-2">Admin Pass</div>
                            <div className="col-span-3">Last Updated</div>
                            <div className="col-span-3 text-center">Actions</div>
                        </div>
                        <div className="divide-y divide-amber-100 max-h-[60vh] overflow-y-auto wavy-gold-scrollbar pr-2">
                            {bots.length === 0 ? (
                                <p className="text-center p-8 text-stone-500">No bots yet. Start by creating a new one!</p>
                            ) : (
                                (bots as Bot[]).map(bot => (
                                    <div key={bot.id} className="grid grid-cols-12 items-center p-4 hover:bg-amber-50/50 transition-colors">
                                        <p className="col-span-4 font-semibold text-stone-800 text-lg truncate pr-2" title={bot.name}>{bot.name}</p>
                                        <p className="col-span-2 font-mono text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-md inline-block">{bot.admin_pass}</p>
                                        <p className="col-span-3 text-sm text-stone-600">{new Date(bot.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        <div className="col-span-3 flex justify-center items-center gap-1 sm:gap-2">
                                            <button onClick={() => handleManageKnowledge(bot)} className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition">Manage Knowledge</button>
                                            <button onClick={() => handleShowEmbed(bot)} className="p-2 rounded-full hover:bg-blue-100 text-blue-700 transition" aria-label="Embed Code"><CodeIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDeleteBot(bot.id)} className="p-2 rounded-full hover:bg-red-100 text-red-700 transition" aria-label="Delete Bot"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {isCreateModalOpen && (
                <Modal onClose={handleCloseCreateModal} title="Create New Bot">
                    <form onSubmit={handleCreateBot} className="space-y-6">
                        <div>
                            <label htmlFor="botName" className="block text-lg font-medium text-stone-700 mb-2">Bot Name</label>
                            <input type="text" name="botName" id="botName" required className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"/>
                        </div>
                         <div>
                            <label htmlFor="botImage" className="block text-lg font-medium text-stone-700 mb-2">Bot Image (for Icon & Welcome)</label>
                            <div className="mt-2 flex items-center gap-4">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Bot preview" className="w-16 h-16 rounded-full object-cover border-2 border-amber-300" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                                        <UserIcon className="w-8 h-8"/>
                                    </div>
                                )}
                                <input type="file" name="botImage" id="botImage" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"/>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="wavyColor" className="block text-lg font-medium text-stone-700 mb-2">Bot Color Theme</label>
                            <select name="wavyColor" id="wavyColor" className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors">
                                {colorOptions.map(opt => (
                                    <option key={opt.name} value={opt.value}>{opt.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="welcomeMessage" className="block text-lg font-medium text-stone-700 mb-2">Welcome Message</label>
                            <textarea name="welcomeMessage" id="welcomeMessage" rows={3} required className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"></textarea>
                        </div>
                        <div>
                            <label htmlFor="initialKnowledge" className="block text-lg font-medium text-stone-700 mb-2">Initial Knowledge Base (Optional)</label>
                             <textarea name="initialKnowledge" id="initialKnowledge" rows={5} placeholder="Paste text here. Separate paragraphs with a blank line..." className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"></textarea>
                        </div>
                        <div className="text-center pt-4">
                            <button type="submit" className="px-12 py-4 bg-wavy-gold-button text-black text-xl font-bold rounded-full hover:shadow-lg transition-shadow shadow-md transform hover:scale-105">
                                Create Bot
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {isEmbedModalOpen && selectedBot && (
                <EmbedCodeModal botId={selectedBot.id} onClose={() => setIsEmbedModalOpen(false)} />
            )}
        </div>
    );
};

export default AdminPage;