import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const business = await prisma.business.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!business) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          business.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: business.id,
          email: business.email,
          name: business.name,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id)
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as number
      }
      return session
    }
  }
}
