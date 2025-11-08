import { type NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role } = await request.json();
    console.log("[API] /api/auth/signup POST", { hasEmail: !!email, hasPassword: !!password, hasFullName: !!fullName, role });

    if (!email || !password || !fullName  || !role) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const users = await getCollection("users");
    console.log("[API] /api/auth/signup POST collection ready");

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    console.log("[API] /api/auth/signup POST existing user lookup", { found: !!existingUser });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "User already exists" }, { status: 409 });
    }

    // For demo: store plain password. In production, hash the password!
    const newUser = {
      email,
      password,
      fullName,
      role,
    };
    console.log("[API] /api/auth/signup POST payload prepared", { email, role });
    const result = await users.insertOne(newUser);
    console.log("[API] /api/auth/signup POST insert complete", { insertedId: result.insertedId.toString() });

    // Generate a mock token (replace with JWT in production)
    const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");
    console.log("[API] /api/auth/signup POST token generated");

    const response = {
      success: true,
      message: "User created successfully",
      token,
      user: {
        _id: result.insertedId,
        email,
        fullName,
        role,
      },
    };
    console.log("[API] /api/auth/signup POST success", { email });
    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] /api/auth/signup POST error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
