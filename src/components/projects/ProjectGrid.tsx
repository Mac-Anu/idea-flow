"use client";

import { motion } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/server/projects/type";

/**
 * 项目卡片网格。两列布局，卡片依次淡入上移（stagger）。
 */
export function ProjectGrid({ projects }: { projects: Project[] }) {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {projects.map((project, i) => (
                <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.4), ease: "easeOut" }}
                >
                    <ProjectCard project={project} />
                </motion.div>
            ))}
        </div>
    );
}
