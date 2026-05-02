export const authPath = "/auth";

/**
 * 发送验证码的类型
 */
export enum EmailOTPType {
    SIGN_IN = "sign-in",
    EMAIL_VERIFICATION = "email-verification",
    FORGET_PASSWORD = "forget-password",
}
