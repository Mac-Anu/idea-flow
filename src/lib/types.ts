import type dayjs from "dayjs";

/**
 * 应用配置
 */
export interface AppConfig {
    /**
     * 应用名称
     */
    appName: string;
    /**
     * 基础url
     */
    baseUrl: string;
    /**
     * API路径
     */
    apiPath: string;

    /**
     * 时区,默认Asia/Shanghai
     */
    timezone?: string;
    /**
     * 语言,默认zh-cn
     */
    locale?: string;
}

/**
 * 将日期类型转换为字符串类型
 */
export type DateToString<T> = {
    [K in keyof T]: T[K] extends Date ? string : T[K];
};

/**
 * getTime函数获取时间的选项参数
 */
export interface TimeOptions {
    /**
     * 时间
     */
    date?: dayjs.ConfigType;
    /**
     * 输出格式
     */
    format?: dayjs.OptionType;
    /**
     * 语言
     */
    locale?: string;
    /**
     * 是否严格模式
     */
    strict?: boolean;
    /**
     * 时区
     */
    timezone?: string;
}
