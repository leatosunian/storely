import mongoose from "mongoose";

const connectionStatus: { isConnected?: number } = {};

export default async function connectDB() {
  if (connectionStatus.isConnected) return;
  const connection = await mongoose.connect(process.env.MONGO_URL!);
  connectionStatus.isConnected = connection.connections[0].readyState;
}
