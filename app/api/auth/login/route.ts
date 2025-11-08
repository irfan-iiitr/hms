import { type NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log("[API] /api/auth/login POST", { hasEmail: !!email, hasPassword: !!password });

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password required" }, { status: 400 });
    }

    const users = await getCollection("users");
    console.log("[API] /api/auth/login POST collection ready");
    const user = await users.findOne({ email });
    console.log("[API] /api/auth/login POST lookup", { found: !!user });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // For demo: compare plain text passwords. In production, use hashed passwords!
    if (user.password !== password) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    // Generate a mock token (replace with JWT in production)
    const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");
    console.log("[API] /api/auth/login POST token generated");

    const response = {
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        name: user.fullName,
        id: user._id?.toString?.(),
      },
    };
    console.log("[API] /api/auth/login POST success", { email: user.email });
    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] /api/auth/login POST error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
