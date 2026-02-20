const errorMessages: Record<string, string> = {
    "Invalid login credentials": "帳號或密碼錯誤",
    "User already registered": "此 Email 已註冊",
    "Email not confirmed": "Email 尚未驗證，請檢查信箱",
    "Password should be at least 6 characters": "密碼至少需要 6 個字元",
    "Signup requires a valid password": "請輸入有效的密碼",
    "Email rate limit exceeded": "操作過於頻繁，請稍後再試",
    "email rate limit exceeded": "操作過於頻繁，請稍後再試",
    "For security purposes, you can only request this once every 60 seconds": "基於安全考量，每 60 秒只能請求一次",
}

export function translateError(message: string): string {
    return errorMessages[message] || message
}
