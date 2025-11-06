import { NextResponse } from "next/server";
import connectDb from "@/middleware/mongoose";
import User from "@/models/User";
import nodemailer from "nodemailer";

export async function POST(req) {
  await connectDb();

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP and expiration (15 minutes from now)
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000);
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expirationTime;
    await user.save();

    // Create email transporter using Gmail SMTP (free tier)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your Gmail app password
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CodeSweat - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hello ${user.name},
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              You requested to reset your password for your CodeSweat account. Please use the following OTP to proceed:
            </p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <h1 style="color: #e91e63; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              This OTP will expire in 15 minutes. If you didn't request this password reset, please ignore this email.
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
              Best regards,<br>
              <strong>CodeSweat Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "OTP sent to your email successfully" },
      { status: 200 }
    );

  } catch (err) {
    console.error("Error in forgot-password:", err);
    
    // Provide more specific error messages
    let errorMessage = "Server error. Please try again later.";
    if (err.message && err.message.includes("Invalid login")) {
      errorMessage = "Email configuration error. Please check your Gmail credentials.";
    } else if (err.message && err.message.includes("timeout")) {
      errorMessage = "Email service timeout. Please try again.";
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

