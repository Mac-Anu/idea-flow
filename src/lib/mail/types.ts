import type AliyunClientObj from "@alicloud/dm20151123";
import type { $OpenApiUtil } from "@alicloud/openapi-core";
import type { Transporter } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPConnection from "nodemailer/lib/smtp-connection";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { ClientConfig as DefaultTencentCloudConfig } from "tencentcloud-sdk-nodejs-common";
import type { ses as TencentClientObj } from "tencentcloud-sdk-nodejs-ses";
import type { SendEmailRequest as DefaultTencentSendOptions } from "tencentcloud-sdk-nodejs-ses/tencentcloud/services/ses/v20201002/ses_models";

export type DefaultAliyunConfig = $OpenApiUtil.Config;

export type DefaultSmtpConfig = SMTPConnection.Options;

/**
 * 邮件客户端基础配置
 */
interface BaseMailClientConfig {
    /**
     * 配置名称
     */
    name: string;
}

/**
 * 阿里云邮件客户端构建函数的选项配置
 */
interface AliyunMailClientConfig extends BaseMailClientConfig {
    type: "aliyun";
    options: Omit<DefaultAliyunConfig, "toMap">;
    default: Required<Pick<BaseMailSendOptions, "from">> &
        Pick<BaseMailSendOptions, "fromName" | "reply" | "replyName">;
}

/**
 * 腾讯云邮件客户端构建函数的选项配置
 */
interface TencentCloudMailClientConfig extends BaseMailClientConfig {
    type: "tcloud";
    options: DefaultTencentCloudConfig;
    default: Required<Pick<BaseMailSendOptions, "from">>;
}

/**
 * SMTP邮件客户端构建函数的选项配置
 */
interface SmtpMailClientConfig extends BaseMailClientConfig {
    type: "smtp";
    options: DefaultSmtpConfig;
    default: Required<Pick<BaseMailSendOptions, "from">> & Pick<BaseMailSendOptions, "reply">;
}

/**
 * 邮件客户端构建函数的选项配置
 */
export type MailClientConfig =
    | AliyunMailClientConfig
    | TencentCloudMailClientConfig
    | SmtpMailClientConfig;

/**
 * 邮件配置
 */
export interface MailConfig {
    /**
     * 默认邮件客户端名称
     */
    defaultClient: string;
    /**
     * 邮件客户端列表
     */
    clients: Array<MailClientConfig>;
}

/**
 * 阿里云邮件客户端类型
 */
export interface AliyunMailClient extends Omit<AliyunMailClientConfig, "options"> {
    client: AliyunClientObj;
}

/**
 * 腾讯云邮件客户端类型
 */
export interface TencentMailClient extends Omit<TencentCloudMailClientConfig, "options"> {
    client: InstanceType<typeof TencentClientObj.v20201002.Client>;
}

/**
 * SMTP 邮件客户端类型
 */
export interface SmtpMailClient extends Omit<SmtpMailClientConfig, "options"> {
    client: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>;
}

/**
 * 邮件客户端类型
 */
export type MailClient = AliyunMailClient | TencentMailClient | SmtpMailClient;

/**
 * 邮件发送函数选项参数基础类型
 */
export interface BaseMailSendOptions {
    /**
     * 发件人邮箱地址
     */
    from?: string;
    /**
     * 发件人名称
     */
    fromName?: string;
    /**
     * 收件人邮箱地址列表
     */
    to: string[];
    /**
     * 邮件主题
     */
    subject: string;
    /**
     * 抄送人邮箱地址列表
     */
    cc?: string[];
    /**
     * 密送人邮箱地址列表
     */
    bcc?: string[];
    /**
     * 回复邮箱地址
     */
    reply?: string;
    /**
     * 回复邮箱名称
     */
    replyName?: string;
    /**
     * 变量
     */
    vars: Record<string, any>;
}

/**
 * 腾讯云邮件发送函数选项参数类型
 */
export type TencentCloudSendMailOptions = BaseMailSendOptions & {
    templateId: number;
    others?: Omit<
        DefaultTencentSendOptions,
        | "FromEmailAddress"
        | "Destination"
        | "Subject"
        | "Template"
        | "Simple"
        | "ReplyToAddresses"
        | "vars"
    >;
};

/**
 * 阿里云邮件发送函数选项参数类型
 */
export type AliyunSendMailOptions = BaseMailSendOptions &
    ({ templateId: string } | { templatePath: string }) & {
        others: Record<string, any> & { addressType?: number };
    };

/**
 * SMTP 邮件发送函数选项参数类型
 */
export type SmtpSendMailOptions = Omit<BaseMailSendOptions, "subject"> & { subject?: string } & {
    templatePath: string;
    others?: Omit<Mail.Options, "replyTo" | "replyName">;
};

/**
 * 邮件发送函数选项参数类型
 */
export type MailSendOptions =
    | AliyunSendMailOptions
    | TencentCloudSendMailOptions
    | SmtpSendMailOptions;
