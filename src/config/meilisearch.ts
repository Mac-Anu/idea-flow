export interface MeilisearchOption {
    name: string;
    host: string;
    apiKey?: string;
}

export interface MeilisearchConfig {
    default: string;
    connections: MeilisearchOption[];
}

export const meilisearchConfig: MeilisearchConfig = {
    default: 'default',
    connections: [
        {
            name: 'default',
            host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
            apiKey: process.env.MEILISEARCH_API_KEY,
        },
    ],
};
