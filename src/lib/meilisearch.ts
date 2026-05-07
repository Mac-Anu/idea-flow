import { Meilisearch } from 'meilisearch';
import { meilisearchConfig } from '@/config/meilisearch';

export const createMeilisearchClients = () => {
    const clients: { [key: string]: Meilisearch } = {};
    for (const conn of meilisearchConfig.connections) {
        clients[conn.name] = new Meilisearch({ host: conn.host, apiKey: conn.apiKey });
    }
    return clients;
};

export const getMeilisearchClient = (
    clients: { [key: string]: Meilisearch },
    name?: string,
): Meilisearch => {
    const cName = name ?? meilisearchConfig.default;
    if (!clients[cName]) throw new Error(`MeiliSearch client "${cName}" not found`);
    return clients[cName];
};
