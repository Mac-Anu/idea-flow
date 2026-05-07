import "dotenv/config"; // 强制最先加载 .env

async function run() {
    // 必须用动态 import，确保 .env 加载完毕后再初始化大模型
    const { reflectionAgent } = await import("../server/agent/index");
    
    console.log("🚀 正在启动 AI 反思智能体...\n");
    
    // 给它一个很容易让它啰嗦或者犯错的问题
    const prompt = "请用极其啰嗦的话，介绍一下什么是 Vibe Coding？";
    console.log(`👨‍💻 用户问题：${prompt}\n`);
    console.log("--- 开始执行工作流 ---\n");

    try {
        const result = await reflectionAgent.invoke({
            messages: [{ role: "user", content: prompt }]
        });
        
        console.log("\n--- 执行完毕 ---");
        console.log("📜 内部思考与反思全过程：");
        result.messages.forEach((msg: any, index: number) => {
            const role = msg._getType ? msg._getType() : "unknown";
            // 截取前 50 个字符展示，免得屏幕被撑爆
            const preview = msg.content.substring(0, 50).replace(/\n/g, " ") + "...";
            console.log(`[步骤 ${index + 1}] 角色: ${role.padEnd(9)} | 内容: ${preview}`);
        });

        console.log("\n=============================================");
        console.log("🎯 最终输出 (经过审查员审核的答案)：");
        console.log("=============================================\n");
        const lastMsg = result.messages[result.messages.length - 1];
        // 如果最后一条是审查员的 "PERFECT"，那么真正的文章其实在倒数第二条里
        const finalContent = typeof lastMsg.content === 'string' && lastMsg.content.includes("PERFECT") 
            ? result.messages[result.messages.length - 2].content 
            : lastMsg.content;
            
        console.log(finalContent);

    } catch (error) {
        console.error("❌ 发生错误:", error);
    }
}

run();
