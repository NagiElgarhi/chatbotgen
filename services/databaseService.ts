import { Bot, Knowledge, Product } from './types';

const API_BASE_URL = 'http://localhost:3001/api'; // This should point to your running backend server

const handleResponse = async (response: Response) => {
    if (response.ok) {
        // Handle 204 No Content for delete operations
        if (response.status === 204) {
            return;
        }
        return response.json();
    } else {
        const errorBody = await response.text();
        const errorMessage = `Request failed. The server responded with status ${response.status}. Details: ${errorBody}`;
        console.error('[Database Service] Error:', errorMessage);
        throw new Error(errorMessage);
    }
};

const handleError = (error: any, context: string): never => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
        const message = `[Database Service] Notice: Could not connect to the backend for ${context}.\n` +
            `This is expected if the backend server is not running at ${API_BASE_URL}.\n` +
            `Please ensure the server is running and accessible. Check guide/index.html for instructions.`;
        console.log(message);
        throw new Error('Could not connect to the backend server. Is it running?');
    }
    console.error(`[Database Service] An unexpected error occurred during ${context}:`, error);
    throw error; // Re-throw the original error after logging
};


// --- Bot Management ---

export const getBots = async (): Promise<Omit<Bot, 'knowledge'>[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/bots`);
        return await handleResponse(response);
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            const message = `[Database Service] Notice: Could not connect to the backend to get the bot list.\n` +
                `This is an expected notice if the backend server is not yet running.\n` +
                `Please follow the instructions in 'guide/index.html' to start the server.\n` +
                `The admin page will show an empty list for now.`;
            console.info(message);
            return [];
        }
        console.error('[Database Service] An unexpected error occurred during getBots:', error);
        throw error;
    }
};

export const getBot = async (id: string): Promise<Bot> => {
    try {
        const response = await fetch(`${API_BASE_URL}/bots/${id}`);
        return await handleResponse(response);
    } catch (error) {
        return handleError(error, `getBot with id ${id}`);
    }
};

export const createBot = async (data: { name: string; welcome_message: string; knowledge?: Knowledge }): Promise<Bot> => {
    try {
        const response = await fetch(`${API_BASE_URL}/bots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await handleResponse(response);
    } catch (error) {
        return handleError(error, 'createBot');
    }
};

export const deleteBot = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/bots/${id}`, { method: 'DELETE' });
        await handleResponse(response);
    } catch (error) {
        return handleError(error, `deleteBot with id ${id}`);
    }
};

export const updateBotKnowledge = async (id: string, knowledge: Knowledge): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/bots/${id}/knowledge`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ knowledge }),
        });
        await handleResponse(response);
    } catch (error) {
        return handleError(error, `updateBotKnowledge for id ${id}`);
    }
};

// --- Product Management ---

export const getProducts = async (): Promise<Product[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        return await handleResponse(response);
    } catch (error) {
         return handleError(error, 'getProducts');
    }
};

export const createProduct = async (productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> => {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
        });
        return await handleResponse(response);
    } catch (error) {
        return handleError(error, 'createProduct');
    }
};

export const deleteProduct = async (id: number): Promise<void> => {
     try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
        await handleResponse(response);
    } catch (error) {
        return handleError(error, `deleteProduct with id ${id}`);
    }
};


// --- Admin Features ---

export const backupDatabase = async (): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/backup`);
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `bots_backup_${timestamp}.db`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
         return handleError(error, 'backupDatabase');
    }
};
