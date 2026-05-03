import type { Job } from "bullmq";

import { Worker } from "bullmq";
import { isNil } from "lodash";

import { getWorkerConnection } from "@/lib/queue";

import type { EmailOTPType } from "./constants";

import { serverIncs } from "../common/app";
import { sendOTPHandler } from "./otp";

export const addOTPQueue = async (email: string, code: string, type: `${EmailOTPType}`) => {
    if (!isNil(serverIncs.queues.OTP)) {
        return await serverIncs.queues.OTP.add(type, { email, code });
    } else {
        return await sendOTPHandler(
            {
                email,
                code,
            },
            type,
        );
    }
};

const addOTPWorker = async () => {
    if (!isNil(serverIncs.queues.OTP)) {
        const worker = new Worker(
            "OTP",
            async (job: Job) => {
                const { email, code } = job.data;
                await sendOTPHandler({ email, code }, job.name as `${EmailOTPType}`);
            },
            { connection: getWorkerConnection("OTP", serverIncs.redis) },
        );
        worker.on("completed", (_job) => {});
    }
};

export const addUserQueueWorker = async () => {
    await addOTPWorker();
};
