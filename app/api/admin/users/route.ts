import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unauthorized, forbidden } from "next/navigation";
import { db } from "@/database";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      unauthorized();
    }

    // Only admins can view all users
    if (session.user.role !== "admin") {
      forbidden();
    }

    const allUsers = await db.query.users.findMany({
      orderBy: (users, { asc }) => [asc(users.name)],
    });

    // Remove sensitive data
    const usersWithoutPasswords = allUsers.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json(usersWithoutPasswords);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
