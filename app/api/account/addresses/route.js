import { NextResponse } from "next/server";
import connectDb from "@/middleware/mongoose";
import Address from "@/models/Address";
import jwt from "jsonwebtoken";

// Disable caching for this route (always serve fresh data)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get all addresses for a user
export async function GET(req) {
  try {
    await connectDb();
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: "Access denied. No token provided." }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const addresses = await Address.find({ userId: decoded.userId }).sort({ isDefault: -1, createdAt: -1 });
    
    return NextResponse.json(
      { success: true, addresses },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 });
  }
}

// Create a new address
export async function POST(req) {
  try {
    await connectDb();
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: "Access denied. No token provided." }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await req.json();
    
    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await Address.updateMany({ userId: decoded.userId }, { isDefault: false });
    }
    
    const address = new Address({
      ...body,
      userId: decoded.userId
    });
    
    await address.save();
    return NextResponse.json({ success: true, address }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 });
  }
}
