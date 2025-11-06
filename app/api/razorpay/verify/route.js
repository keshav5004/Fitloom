import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay secret missing' }, { status: 500 });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment params' }, { status: 400 });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: 'Verification error', message: err?.message }, { status: 500 });
  }
}


