import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", { apiVersion: "2024-06-20" as any });

export async function POST(req: Request) {
  const { planId, planName, price, memberId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: planName },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXTAUTH_URL}/member/membership?success=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/member/membership`,
    metadata: { planId, memberId },
  });

  return NextResponse.json({ url: session.url });
}
