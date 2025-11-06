import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const { amount, currency = 'INR', productName } = await req.json();

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay keys missing in env" },
        { status: 500 }
      );
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await rzp.orders.create({
      amount: Math.round(numericAmount), // already in paise
      currency,
      receipt: `rcpt_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      productName: productName || 'Order Payment',
    }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create Razorpay order", message: err?.message },
      { status: 500 }
    );
  }
}


