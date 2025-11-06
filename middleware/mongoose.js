import mongoose from "mongoose";

let isConnected = false;

const connectDb = async () => {
  if (isConnected) return;

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in environment variables");
  }

  await mongoose.connect(mongoUri, {
    bufferCommands: false,
  });
  isConnected = true;
};

export default connectDb;
