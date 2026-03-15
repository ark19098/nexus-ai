import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
        id: string
        orgId: string | null
        role: string | null
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        id: string
        orgId?: string | null
        role?: string | null
    }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    orgId: string | null
    role: string | null
  }
}