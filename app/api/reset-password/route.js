import { NextResponse } from "next/server";
import connectDb from "@/middleware/mongoose";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req) {
  await connectDb();

  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if OTP exists and is valid
    if (!user.resetPasswordOTP) {
      return NextResponse.json(
        { error: "No password reset request found. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Check if OTP matches
    if (user.resetPasswordOTP !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP. Please check and try again." },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (user.resetPasswordExpires < new Date()) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // If newPassword is "VERIFY_ONLY", just verify OTP without changing password
    if (newPassword === "VERIFY_ONLY") {
      return NextResponse.json(
        { message: "OTP verified successfully" },
        { status: 200 }
      );
    }

    // Otherwise, reset the password
    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    // Validate new password (minimum 6 characters)
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear OTP fields
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );

  } catch (err) {
    console.error("Error in reset-password:", err);
    return NextResponse.json(
      { error: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}

