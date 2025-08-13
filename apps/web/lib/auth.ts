import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from './db';
import { Role } from '../types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      companyId: string;
      storeIds: string[];
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    companyId: string;
    storeIds: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    companyId: string;
    storeIds: string[];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: {
              company: true,
            },
          });

          if (!user) {
            throw new Error('Invalid credentials');
          }

          // For now, we'll use a simple password check
          // In production, you should hash passwords properly
          const isPasswordValid = await compare(credentials.password, user.password || '');
          
          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }

          // Parse storeIds from JSON string
          const storeIds = JSON.parse(user.storeIds || '[]') as string[];

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as Role,
            companyId: user.companyId,
            storeIds,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.storeIds = user.storeIds;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.storeIds = token.storeIds;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret',
};