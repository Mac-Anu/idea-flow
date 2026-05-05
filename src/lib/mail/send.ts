import Email from "email-templates";
import path from "node:path";
import { SmtpMailClient, SmtpSendMailOptions } from "./types";
import { deepMerge } from "../utils";
/**
 * email-templates 实例
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
 * 发送 SMTP 邮件
 * @param params
 * @param options
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
 * 发送阿里云邮件 (占位)
 */
export const sendAliyunMail = async (params: any, options: any) => {
    throw new Error("阿里云发信功能暂未实现");
};

/**
 * 发送腾讯云邮件 (占位)
 */
export const sendTencentMail = async (params: any, options: any) => {
    throw new Error("腾讯云发信功能暂未实现");
};
