import BranchModel from "@/lib/db/models/branch";
import connectDB from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await connectDB();
  const data = await request.json();
  try {
    const newBranch = await BranchModel.create(data);
    return NextResponse.json({ msg: "BRANCH_CREATED", newBranch });
  } catch (error) {
    return NextResponse.json({ msg: "BRANCH_CREATION_ERROR" });
  }
}

export async function GET(request: NextRequest) {
  await connectDB();

  try {
    const branches = await BranchModel.find();
    return NextResponse.json({ msg: "BRANCHES_GET", branches });
  } catch (error) {
    return NextResponse.json({ msg: "GET_BRANCH_ERROR" });
  }
}

export async function PUT(request: NextRequest) {
  await connectDB();
  const data = await request.json();

  try {
    const editedBranch = await BranchModel.findByIdAndUpdate(
      { _id: data._id },
      data,
      { new: true }
    );
    return NextResponse.json({ msg: "BRANCH_EDITED", editedBranch });
  } catch (error) {
    return NextResponse.json({ msg: "EDIT_BRANCH_ERROR" });
  }
}

export async function DELETE(request: NextRequest) {
  await connectDB();
  const data = await request.json();

  try {
    await BranchModel.findByIdAndDelete(data);
    return NextResponse.json({ msg: "BRANCH_DELETED" });
  } catch (error) {
    return NextResponse.json({ msg: "DELETE_BRANCH_ERROR" });
  }
}
