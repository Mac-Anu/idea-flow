import Email from "email-templates";
import path from "node:path";
import { SmtpMailClient, SmtpSendMailOptions } from "./types";
import { deepMerge } from "../utils";
/**
 * 邮件模板渲染引擎实例 (email-templates)
 * 负责将 Pug 模板与传入的变量结合，生成最终的 HTML 和纯文本邮件内容
 */
const emailTemplates = new Email({
    send: true,
    views: {
        root: path.join(process.cwd(), "files/email-templates"),
        options: {
            extension: "pug",
        },
    },
});
/**
 * 发送基于 SMTP 协议的邮件
 * 自动完成模板渲染、变量注入及发件人信息的深层合并
 * 
 * @param params - SMTP 客户端实例及其默认配置项 (SmtpMailClient)
 * @param options - 发信具体配置，包括目标邮箱、模板路径、注入变量等 (SmtpSendMailOptions)
 * @returns 包含发信回执的 Promise 对象
 */
export const sendSmtpMail = async (params: SmtpMailClient, options: SmtpSendMailOptions) => {
    const { others, templatePath, vars, ...rest } = options;
    const newOptions: Record<string, any> = deepMerge(
        {
            ...rest,
            from: options.from ?? params.default.from,
            replyTo: options.reply ?? params.default.reply,
            ...others,
        },
        options.others ?? {},
        "replace",
    );
    newOptions.html = await emailTemplates.render(`${templatePath.toString()}/html`, vars);
    newOptions.text = await emailTemplates.render(`${templatePath.toString()}/text`, vars);

    return params.client.sendMail(newOptions);
};

/**
 * 阿里云 DirectMail 服务发信接口 (占位方法)
 * 计划用于规避 SMTP 限制，通过官方 HTTP API 实现高并发发信
 * 
 * @param params - 阿里云发信客户端实例
 * @param options - 发信参数
 * @throws 暂未实现该接口，调用将抛出异常
 */
export const sendAliyunMail = async (params: any, options: any) => {
    throw new Error("阿里云发信功能暂未实现");
};

/**
 * 腾讯云 SES 服务发信接口 (占位方法)
 * 计划用于集成腾讯云的企业级邮件推送服务
 * 
 * @param params - 腾讯云发信客户端实例
 * @param options - 发信参数
 * @throws 暂未实现该接口，调用将抛出异常
 */
export const sendTencentMail = async (params: any, options: any) => {
    throw new Error("腾讯云发信功能暂未实现");
};
