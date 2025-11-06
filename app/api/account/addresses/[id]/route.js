import { NextResponse } from "next/server";
import connectDb from "@/middleware/mongoose";
import Address from "@/models/Address";
import jwt from "jsonwebtoken";

// Update an address
export async function PUT(req, { params }) {
  try {
    await connectDb();
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: "Access denied. No token provided." }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await req.json();
    
    const address = await Address.findOne({ _id: params.id, userId: decoded.userId });
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    
    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await Address.updateMany({ userId: decoded.userId, _id: { $ne: params.id } }, { isDefault: false });
    }
    
    const updatedAddress = await Address.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    );
    
    return NextResponse.json({ success: true, address: updatedAddress }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 });
  }
}

// Delete an address
export async function DELETE(req, { params }) {
  try {
    await connectDb();
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: "Access denied. No token provided." }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const address = await Address.findOne({ _id: params.id, userId: decoded.userId });
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    
    await Address.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: "Address deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 });
  }
}
