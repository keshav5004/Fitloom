import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Since JWT is stateless, logout is handled on the client side
    // by removing the token from localStorage
    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error during logout:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
