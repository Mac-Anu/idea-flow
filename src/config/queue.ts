import type { QueueConfig } from "@/lib/queue";

export const queueConfig: QueueConfig = {
    OTP: {
        redis: "default",
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: "exponential",
                delay: 1000,
            },
        },
    },
    ARTICLE_TASKS: {
        redis: "default",
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
        },
    },
};
