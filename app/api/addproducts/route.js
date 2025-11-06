import { NextResponse } from "next/server";
import Product from "@/models/Product";
import connectDb from "@/middleware/mongoose";

export async function POST(req) {
    try {
        await connectDb();

        const body = await req.json();
        const { title, slug, description, img, category, variants } = body;

        if (!title || !slug || !description || !img || !category || !variants || variants.length === 0) {
            return NextResponse.json(
                { success: false, message: "Please fill all the required fields." },
                { status: 400 }
            );
        }

        // Check if product already exists
        let product = await Product.findOne({ slug });

        if (product) {
            // Filter out variants that already exist (same size + color)
            const newVariants = variants.filter(v => 
                !product.variants.some(existing => existing.size === v.size && existing.color === v.color)
            );

            if (newVariants.length === 0) {
                return NextResponse.json(
                    { success: false, message: "All variants already exist for this product." },
                    { status: 400 }
                );
            }

            // Add only new variants
            product.variants.push(...newVariants);

        } else {
            // Create new product
            product = new Product({ title, slug, description, img, category, variants });
        }

        await product.save();

        return NextResponse.json(
            { success: true, message: "Product added successfully", product },
            { status: 201 }
        );

    } catch (error) {
        console.error("error saving product:", error);
        return NextResponse.json(
            { success: false, message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
