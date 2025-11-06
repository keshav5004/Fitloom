import { NextResponse } from "next/server";
import connectDb from "@/middleware/mongoose";
import Order from "@/models/Order";
import jwt from "jsonwebtoken";

// Disable caching for this route (always serve fresh data)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get all orders for a user
export async function GET(req) {
  try {
    try {
      await connectDb();
    } catch (dbErr) {
      console.error("DB connection error in orders GET:", dbErr);
      return NextResponse.json({ error: "Database connection error", message: dbErr.message }, { status: 500 });
    }
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: "Access denied. No token provided." }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (jwtErr) {
      console.error("JWT verify error in orders GET:", jwtErr);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    const orders = await Order.find({ userId: decoded.userId })
      .populate('products.productId')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(
      { success: true, orders },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error("Unhandled error in orders GET:", error);
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 });
  }
}
