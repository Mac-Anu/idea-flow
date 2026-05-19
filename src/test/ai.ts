import "dotenv/config"; // 强制最先加载 .env

async function run() {
    // 必须用动态 import，确保 .env 加载完毕后再初始化大模型
    const { reflectionAgent } = await import("../server/agent/index");
    
    console.log("=================================================");
    console.log("🚀  AI 反思智能体开发测试终端 (Interactive Test CLI)  🚀");
    console.log("=================================================\n");
    
    // 从命令行参数获取问题，如果没有则使用默认问题
    const args = process.argv.slice(2);
    const prompt = args.join(" ") || "请用极其啰嗦的话，介绍一下什么是 Vibe Coding？";
    
    console.log(`👤  提问用户: Felix`);
    console.log(`📝  输入问题: "${prompt}"`);
    console.log("\n------------------ 🤖 智能体工作流开始 ------------------\n");

    const startTime = Date.now();

    try {
        const result = await reflectionAgent.invoke({
            messages: [{ role: "user", content: prompt }]
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log("\n------------------ 🏁 工作流执行完毕 ------------------");
        console.log(`⏱️  耗时统计: 耗时 ${duration} 秒`);
        console.log("📜  思考与反思链轨迹 (Agent Execution Trace):");
        
        result.messages.forEach((msg: any, index: number) => {
            const role = msg._getType ? msg._getType() : "unknown";
            // 截取前 80 个字符展示，提升日志可读性
            const preview = typeof msg.content === 'string' 
                ? msg.content.substring(0, 80).replace(/\n/g, " ") + "..."
                : JSON.stringify(msg.content);
            console.log(`   [步骤 ${index + 1}] 角色: ${role.padEnd(10)} | 内容预览: ${preview}`);
        });

        console.log("\n=======================================================");
        console.log("🎯  最终输出结果 (经过三阶段反思审查后的最终答案):");
        console.log("=======================================================\n");
        
        const lastMsg = result.messages[result.messages.length - 1];
        // 提取最终完美的内容
        const finalContent = typeof lastMsg.content === 'string' && lastMsg.content.includes("PERFECT") 
            ? result.messages[result.messages.length - 2].content 
            : lastMsg.content;
            
        console.log(finalContent);
        console.log("\n=======================================================");
        console.log("🎉  测试圆满结束！Antigravity 协助 Felix 开发顺利！");
        console.log("=======================================================\n");

    } catch (error) {
        console.error("❌  智能体运行发生错误:", error);
    }
}

run();
