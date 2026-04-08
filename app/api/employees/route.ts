import AdminModel from "@/lib/db/models/admin";
import connectDB from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await connectDB();
  const data = await request.json();
  try {
    const newUser = await AdminModel.create(data);
    return NextResponse.json({ msg: "USER_CREATED", newUser });
  } catch (error) {
    return NextResponse.json({ msg: "USER_CREATION_ERROR" });
  }
}

export async function GET(request: NextRequest) {
  await connectDB();
  try {
    const employees = await AdminModel.find().select("-password");
    return NextResponse.json({ msg: "USER_GET", employees });
  } catch (error) {
    return NextResponse.json({ msg: "GET_USER_ERROR" });
  }
}

export async function PUT(request: NextRequest) {
  await connectDB();
  const data = await request.json();

  try {
    const updateData: any = { ...data };
    delete updateData._id;

    if (!updateData.password) {
      delete updateData.password;
    }

    const editedUser = await AdminModel.findByIdAndUpdate(
      data._id,
      updateData,
      { new: true }
    ).select("-password");
    return NextResponse.json({ msg: "USER_EDITED", editedUser });
  } catch (error) {
    return NextResponse.json({ msg: "EDIT_USER_ERROR" });
  }
}

export async function DELETE(request: NextRequest) {
  await connectDB();
  const data = await request.json();

  try {
    await AdminModel.findByIdAndDelete(data);
    return NextResponse.json({ msg: "USER_DELETED" });
  } catch (error) {
    return NextResponse.json({ msg: "DELETE_USER_ERROR" });
  }
}
