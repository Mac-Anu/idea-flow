import { Metadata } from "next";
import { Zap } from "lucide-react";
import { TaggedArticleList } from "@/components/home/TaggedArticleList";

export const metadata: Metadata = {
    title: "速查表 - 创想流",
    description: "浓缩的技术速查卡片：面试要点、语法速记、常用命令。",
};

export const dynamic = "force-dynamic";

export default function CheatsheetPage() {
    return (
        <TaggedArticleList
            tag="cheatsheet"
            title="速查表"
            description="把高频知识点浓缩成速查卡片，面试前、写代码时随手一翻就找到。"
            icon={Zap}
            emptyHint="给文章打上 cheatsheet 标签，它就会出现在这里。"
        />
    );
}
