import type {
    AliyunSendMailOptions,
    MailSendOptions,
    SmtpSendMailOptions,
    TencentCloudSendMailOptions,
} from "./types";

import { createClient } from "./client";
import { sendAliyunMail, sendSmtpMail, sendTencentMail } from "./send";

export const sendMail = async (options: MailSendOptions, clientName?: string) => {
    const rst = createClient(clientName);
    const name = rst.name;
    switch (rst.type) {
        case "smtp":
            return sendSmtpMail(rst, options as SmtpSendMailOptions);
        case "aliyun":
            return sendAliyunMail(rst, options as AliyunSendMailOptions);
        case "tcloud":
            return sendTencentMail(rst, options as TencentCloudSendMailOptions);
        default:
            throw new Error(`Unsupported mail client name: ${name}`);
    }
};
