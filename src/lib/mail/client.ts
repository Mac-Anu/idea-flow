// src/libs/mail/client.ts
import type { ClientConfig as DefaultTencentCloudConfig } from "tencentcloud-sdk-nodejs-common";

import AliyunCredential, { Config as AliYunConfig } from "@alicloud/credentials";
import AliyunClient from "@alicloud/dm20151123";
import * as AliyunOpenApi from "@alicloud/openapi-client";
import { isNil } from "lodash";
import nodemailer from "nodemailer";
import { ses as TencentClient } from "tencentcloud-sdk-nodejs-ses";

import { mailConfig } from "@/config/mail";

import type { DefaultAliyunConfig, DefaultSmtpConfig, MailClient } from "./types";

const TencentSES = TencentClient.v20201002.Client;

/**
 * 创建邮件客户端
 * @param name 客户端名称
 */
export const createClient = (name?: string): MailClient => {
    const clientName = name ?? mailConfig.defaultClient;
    const config = mailConfig.clients.find((item) => item.name === clientName);
    if (isNil(config)) {
        throw new Error(`邮件发送配置名 ${clientName} 不存在！`);
    }
    const rst = {
        name: clientName,
        default: config.default,
    } as const;
    switch (config.type) {
        case "aliyun":
            return {
                ...rst,
                type: "aliyun",
                client: createAliyunClient(config.options),
            };
        case "tcloud":
            return {
                ...rst,
                type: "tcloud",
                client: createTencentClient(config.options),
            };
        case "smtp":
            return {
                ...rst,
                type: "smtp",
                client: creatSmtpClient(config.options),
            };
        default:
            throw new Error(`邮件发送配置名 ${clientName} 类型不支持！`);
    }
};

const createAliyunClient = (config: Omit<DefaultAliyunConfig, "toMap">) => {
    const credentialsConfig = new AliYunConfig(config);
    const credentialClient = new AliyunCredential(credentialsConfig);
    const configinc = new AliyunOpenApi.Config({
        ...config,
        credential: credentialClient,
    });
    return new AliyunClient(configinc);
};

const createTencentClient = (config: DefaultTencentCloudConfig) => {
    return new TencentSES(config);
};

const creatSmtpClient = (config: DefaultSmtpConfig) => {
    const transporter = nodemailer.createTransport(config);
    return transporter;
};
