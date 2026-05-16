import { buildClient, fetchApi } from "@/lib/hono";
import type { agentApi } from "@/server/agent/route";
import type { ChatRequest } from "@/server/agent/type";

const agentClient = buildClient<typeof agentApi>("/agent");

export const agentFrontendApi = {
    chat: async (data: ChatRequest) =>
        fetchApi(agentClient, (c) => c.chat.$post({ json: data })),
};
