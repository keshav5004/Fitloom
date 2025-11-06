import { NextResponse } from "next/server";
import Product from "@/models/Product";
import connectDb from "@/middleware/mongoose";
import jwt from "jsonwebtoken";

export async function PUT(req) {
  try {
    await connectDb();

    // Verify JWT token
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: "Access denied. No token provided." }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      // Token is valid, continue with the request
    } catch (error) {
      return NextResponse.json({ success: false, message: "Invalid token." }, { status: 400 });
    }

    const body = await req.json();
    const { slug, title, description, img, category, variants } = body;

    if (!slug) {
      return NextResponse.json({ success: false, message: "Slug is required to update product." }, { status: 400 });
    }

    const product = await Product.findOne({ slug });
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    }

    // Update top-level fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (img) product.img = img;
    if (category) product.category = category;

    // Update or add variants
    if (variants && variants.length > 0) {
      variants.forEach(newVariant => {
        const existing = product.variants.find(v => v.size === newVariant.size && v.color === newVariant.color);
        if (existing) {
          if (newVariant.price !== undefined) existing.price = newVariant.price;
          if (newVariant.availability !== undefined) existing.availability = newVariant.availability;
        } else {
          product.variants.push(newVariant);
        }
      });
    }

    await product.save();
    return NextResponse.json({ success: true, message: "Product updated successfully", product }, { status: 200 });

  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ success: false, message: "Server error", error: error.message }, { status: 500 });
  }
}
