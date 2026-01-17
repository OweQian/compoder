import NextAuth from "next-auth"
import { authOptions } from "./options"

// 获取和 POST 请求都使用 authOptions 配置
export const GET = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
