import { NextResponse } from "next/server";
import connectDb from "@/middleware/mongoose";
import Order from "@/models/Order";
import jwt from "jsonwebtoken";

// Create a new order
export async function POST(req) {
  try {
    await connectDb();
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: "Access denied. No token provided." }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const body = await req.json();
    
    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const order = new Order({
      ...body,
      userId: decoded.userId,
      orderId: orderId
    });
    
    await order.save();

    // Set purchased product variants to out of stock (availability = false)
    // Assumes each item in 'body.products' matches { productId, color, size, quantity }
    const mongoose = require('mongoose'); // Only if mongoose is not already imported
    for (const item of body.products || []) {
      if (!item.productId) continue;
      const product = await mongoose.models.Product.findById(item.productId);
      if (product && product.variants && product.variants.length > 0) {
        // Match variant by color and size (if exists in your model)
        let updated = false;
        for (let v of product.variants) {
          if ((item.color ? v.color === item.color : true) && (item.size ? v.size === item.size : true)) {
            v.availability = false; // Set out of stock
            updated = true;
          }
        }
        if (updated) await product.save();
      }
    }
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 });
  }
}
