import { NextResponse } from "next/server";
import connectDb from "@/middleware/mongoose";
import User from "@/models/User";
import bcrypt from "bcrypt";
var jwt = require('jsonwebtoken');

export async function POST(req) {
  await connectDb();

  try {
    const { email, password } = await req.json();

    // check if both fields are provided
    if (!email || !password) {
      return NextResponse.json(
        { error: "Please provide both email and password" },
        { status: 400 }
      );
    }

    // find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // compare password with hashed one
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        name: user.name 
      }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // success response with token
    return NextResponse.json(
      { 
        message: "Login successful", 
        user: { 
          name: user.name, 
          email: user.email,
          userId: user._id 
        },
        token: token
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("Error during login:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
