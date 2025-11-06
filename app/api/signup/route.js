import { NextResponse } from "next/server";
import connectDb from "@/middleware/mongoose";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req) {
  await connectDb(); // connect to MongoDB

  try {
    const data = await req.json();
    const { name, email, password } = data;

    // check if all fields are provided
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Please provide all fields" }, { status: 400 });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
