import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          requiresPasswordChange: user.requiresPasswordChange
        } as any;
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Bypass strict NEXTAUTH_URL domain checking.
      // This allows the client to explicitly dictate the redirect destination 
      // (like a dynamic local network IP) rather than falling back to localhost.
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return url;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.requiresPasswordChange = (user as any).requiresPasswordChange;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.requiresPasswordChange = token.requiresPasswordChange as boolean;
      }
      return session;
    }
  }
};
