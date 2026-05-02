const seed = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: "pincman@idea-flow.test",
                password: "12345678aA$",
                name: "Pincman",
                username: "pincman" // 需要开启 username 插件才能生效，我们已经开启了
            })
        });
        
        const data = await response.json();
        console.log("响应结果:", data);
        if (response.ok) {
            console.log("✅ 初始账户植入成功！");
        } else {
            console.error("❌ 植入失败");
        }
    } catch (e) {
        console.error("请求报错:", e);
    }
};
seed();
