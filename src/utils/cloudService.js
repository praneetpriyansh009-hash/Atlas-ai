/**
 * CloudService - Abstraction for document storage.
 * Currently uses localStorage but designed to be replaced with 
 * a cloud backend (Firebase/Supabase) easily.
 */

const STORAGE_KEY = 'atlas_document_library';
const GLOBAL_KEY = 'atlas_global_library';

export const CloudService = {
    /**
     * Save a document to either user or global library.
     */
    saveDocument: async (doc, isGlobal = false) => {
        const key = isGlobal ? GLOBAL_KEY : STORAGE_KEY;
        return new Promise((resolve) => {
            const library = CloudService.getCollection(key);
            const index = library.findIndex(d => d.name === doc.name);
            if (index >= 0) {
                library[index] = { ...library[index], ...doc, updatedAt: new Date().toISOString() };
            } else {
                library.push({
                    ...doc,
                    id: doc.id || Math.random().toString(36).substr(2, 9),
                    category: isGlobal ? 'book' : 'user',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            localStorage.setItem(key, JSON.stringify(library));
            setTimeout(() => resolve(true), 500);
        });
    },

    getCollection: (key) => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to parse collection:", key, e);
            return [];
        }
    },

    getAllDocuments: () => CloudService.getCollection(STORAGE_KEY),

    getGlobalLibrary: () => CloudService.getCollection(GLOBAL_KEY),

    /**
     * Searches across ALL collections for RAG.
     */
    searchAll: () => {
        return [...CloudService.getAllDocuments(), ...CloudService.getGlobalLibrary()];
    },

    getDocument: (id) => {
        const all = CloudService.searchAll();
        return all.find(doc => doc.id === id);
    },

    deleteDocument: async (id, isGlobal = false) => {
        const key = isGlobal ? GLOBAL_KEY : STORAGE_KEY;
        return new Promise((resolve) => {
            const library = CloudService.getCollection(key);
            const filtered = library.filter(doc => doc.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
            setTimeout(() => resolve(true), 500);
        });
    }
};

export default CloudService;
