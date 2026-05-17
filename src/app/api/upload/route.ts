import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// 允许的图片类型
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "没有上传文件" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "不支持的文件格式，仅支持 JPG、PNG、GIF、WebP、SVG" },
                { status: 400 },
            );
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "文件大小不能超过 10MB" }, { status: 400 });
        }

        // 生成唯一文件名
        const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
        const hash = crypto.randomBytes(8).toString("hex");
        const timestamp = Date.now();
        const filename = `${timestamp}-${hash}${ext}`;

        // 确保上传目录存在
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        // 写入文件
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // 返回可访问的 URL
        const url = `/uploads/${filename}`;
        return NextResponse.json({ url });
    } catch (error) {
        console.error("文件上传失败:", error);
        return NextResponse.json({ error: "文件上传失败" }, { status: 500 });
    }
}
