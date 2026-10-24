import { NextRequest, NextResponse } from "next/server";
import {
  verifyCustomerToken,
  findCustomerById,
  CUSTOMER_SESSION_COOKIE,
} from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
    const session = await verifyCustomerToken(token);

    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    const customer = await findCustomerById(session.userId);

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: session.userId,
          email: session.email,
          name: customer?.name || session.name,
          phone: customer?.phone,
          role: "CUSTOMER",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Customer Auth] Session verification error:", error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
}
