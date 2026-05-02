const seed = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Origin": "http://localhost:3000",
                "Referer": "http://localhost:3000/"
            },
            body: JSON.stringify({
                email: "pincman@idea-flow.test",
                password: "12345678aA$",
                name: "Pincman",
                username: "pincman" 
            })
        });
        
        const data = await response.json();
        console.log("响应结果:", data);
        if (response.ok) {
            console.log("\n✅ 初始账户植入成功！可以去浏览器测试登录了。");
        } else {
            console.error("\n❌ 植入失败，看上面的响应结果。");
        }
    } catch (e) {
        console.error("请求报错:", e);
    }
};
seed();
