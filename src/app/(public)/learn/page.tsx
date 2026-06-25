import { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { TaggedArticleList } from "@/components/home/TaggedArticleList";

export const metadata: Metadata = {
    title: "学习笔记 - 创想流",
    description: "成体系的学习记录与技术沉淀。",
};

export default function LearnPage() {
    return (
        <TaggedArticleList
            tag="learn"
            title="学习笔记"
            description="记录系统性的学习过程与技术沉淀，把学到的东西梳理成自己的知识体系。"
            icon={GraduationCap}
            emptyHint="给文章打上 learn 标签，它就会出现在这里。"
        />
    );
}
