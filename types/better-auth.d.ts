import "better-auth/react";

declare module "better-auth/react" {
  interface Session {
    user: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null;
      role: string;
      phone?: string | null;
      address?: string | null;
      profileImage?: string | null;
      isActive?: boolean;
    };
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
      token: string;
      ipAddress?: string | null;
      userAgent?: string | null;
    };
  }
}
