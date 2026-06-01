import { beforeServer } from "./server/common/app";

console.log("=========================================");
console.log("🚀 IdeaFlow Background Worker Starting...");
console.log("=========================================");

const startWorker = async () => {
    try {
        await beforeServer();
        console.log("✅ Worker initialized successfully.");
        console.log("⏳ Listening for background jobs (Emails, AI Tasks, etc)...");
        
        // Prevent process from exiting
        process.on("SIGINT", () => {
            console.log("Shutting down worker...");
            process.exit(0);
        });
        process.on("SIGTERM", () => {
            console.log("Shutting down worker...");
            process.exit(0);
        });
    } catch (err) {
        console.error("❌ Worker initialization failed:", err);
        process.exit(1);
    }
};

startWorker();
