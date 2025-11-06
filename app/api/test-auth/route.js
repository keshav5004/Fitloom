import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    // Get token from Authorization header
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: "No token provided", message: "Please login first" },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    return NextResponse.json({
      message: "JWT is working!",
      user: {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name
      },
      tokenInfo: {
        issuedAt: new Date(decoded.iat * 1000).toISOString(),
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        isExpired: decoded.exp < Date.now() / 1000
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { 
        error: "Invalid token", 
        message: error.message,
        details: "JWT verification failed"
      },
      { status: 401 }
    );
  }
}
