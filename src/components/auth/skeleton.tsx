import type { FC, PropsWithChildren } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// 使用符合你目前项目中卡其色/暖色调的主题颜色
const baseSkeletonClass = "bg-[#c8a96e]/20 rounded-xl";

const AuthFormCard: FC<PropsWithChildren> = ({ children }) => (
    <div className="w-full space-y-8">
        {/* 顶部的标题占位符 */}
        <Skeleton className={`mx-auto h-8 w-32 md:w-40 lg:w-48 ${baseSkeletonClass}`} />
        {children}
    </div>
);

const InputSkeleton: FC = () => (
    <div className="space-y-3">
        {/* Label 占位符 */}
        <Skeleton className={`h-4 w-12 bg-[#5e5448]/20`} />
        {/* Input 框占位符 */}
        <Skeleton className={`h-11 w-full ${baseSkeletonClass}`} />
    </div>
);

const ButtonSkeleton: FC = () => (
    <Skeleton className={`h-11 w-full mt-4 bg-[#c8a96e]/40 rounded-full`} />
);

const LinkSkeleton: FC = () => (
    <div className="flex justify-end mt-2">
        <Skeleton className={`h-4 w-20 bg-[#5e5448]/20`} />
    </div>
);

export const AuthFormSkeleton: FC = () => (
    <AuthFormCard>
        <div className="space-y-5">
            <InputSkeleton />
            <InputSkeleton />
            <LinkSkeleton />
            <div className="space-y-4 pt-4">
                <ButtonSkeleton />
            </div>
        </div>
    </AuthFormCard>
);
