import { NextResponse } from "next/server";
import connectDb from "@/middleware/mongoose";
import Order from "@/models/Order";
import jwt from "jsonwebtoken";

// Get specific order
export async function GET(req, { params }) {
  try {
    await connectDb();
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: "Access denied. No token provided." }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const order = await Order.findOne({ _id: params.id, userId: decoded.userId })
      .populate('products.productId');
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 });
  }
}

// Cancel an order
export async function PUT(req, { params }) {
  try {
    await connectDb();
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: "Access denied. No token provided." }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await req.json();
    
    const order = await Order.findOne({ _id: params.id, userId: decoded.userId });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    
    // Only allow cancellation for pending and confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json({ 
        error: "Cannot cancel order", 
        message: "Order cannot be cancelled in current status" 
      }, { status: 400 });
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(
      params.id,
      { 
        status: body.action === 'cancel' ? 'cancelled' : order.status,
        notes: body.notes || order.notes
      },
      { new: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: body.action === 'cancel' ? 'Order cancelled successfully' : 'Order updated successfully'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 });
  }
}
