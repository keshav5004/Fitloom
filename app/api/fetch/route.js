import { NextResponse } from "next/server";
import Product from "@/models/Product";
import connectDb from "@/middleware/mongoose";

export async function POST(req) {
  try {
    await connectDb();

    const body = await req.json();
    const { category, color, size, title, price, slug } = body;

    let filter = {};

    if (category) {
      const base = category.toString().trim();
      const singular = base.replace(/s$/i, "");
      // Match singular or plural, case-insensitive
      filter.category = { $regex: `^${singular}s?$`, $options: "i" };
    }
    if (title) filter.title = { $regex: title, $options: "i" };
    if (slug) filter.slug = slug;

    // Fetch products first
    let products = await Product.find(filter);

    // Filter variants inside each product
    if (color || size || price) {
      products = products.map(product => {
        const filteredVariants = product.variants.filter(v => {
          let matches = true;
          if (color) matches = matches && v.color === color;
          if (size) matches = matches && v.size === size;
          if (price) matches = matches && v.price === price;
          return matches;
        });

        // Only include product if at least one variant matches
        return filteredVariants.length > 0
          ? { ...product.toObject(), variants: filteredVariants }
          : null;
      }).filter(p => p !== null); // remove products with no matching variants
    }

    return NextResponse.json({ success: true, products }, { status: 200 });

  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ success: false, message: "Server error", error: error.message }, { status: 500 });
  }
}
