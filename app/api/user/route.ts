import connectDB from "@/lib/db/db";
import { NextResponse } from "next/server";
import AdminModel from "@/lib/db/models/admin"

export async function GET() {
  await connectDB();
  try {
    const user = await AdminModel.find();
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(error);
  }
}
