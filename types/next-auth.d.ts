// types/next-auth.d.ts
import NextAuth, { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: 'reader' | 'creator';
    };
  }
  interface User {
    id: string;
    role: 'reader' | 'creator';
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: 'reader' | 'creator';
  }
}
