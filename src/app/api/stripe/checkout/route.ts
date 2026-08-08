import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeSecret && stripeSecret !== "sk_test_dummy") {
  stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" as any });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!stripe) {
      return NextResponse.json({ error: "درگاه پرداخت آنلاین در حال حاضر غیرفعال است. لطفاً از کارت به کارت استفاده کنید." }, { status: 503 });
    }

    const { planId, planName, price, memberId } = await req.json();

    if (!planId || !price) {
      return NextResponse.json({ error: "اطلاعات طرح ناقص است" }, { status: 400 });
    }

    // Convert Toman to appropriate currency - for Stripe we use USD but keep original as metadata
    // Price is in Toman, convert to cents for Stripe (approximate)
    // In production, you would integrate with a Toman gateway like ZarinPal, not Stripe
    const amountInCents = Math.round(Number(price) * 100); // keep as is for simulation

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: planName || "Gym Membership" },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/member/membership?success=1`,
      cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/member/membership?canceled=1`,
      metadata: { planId: String(planId), memberId: String(memberId || session.user.id) },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e: any) {
    console.error("Stripe checkout error", e);
    return NextResponse.json({ error: e.message || "خطا در ایجاد جلسه پرداخت" }, { status: 500 });
  }
}
