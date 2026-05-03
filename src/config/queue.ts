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
};
