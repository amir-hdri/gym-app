import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-[#0c0c0c] text-[#ece6dc] flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <h1 className="font-serif text-[40px]">Lost in the dusk</h1>
        <p className="text-[#8a847a] mt-2 mb-6 text-sm">That path isn’t here. Return home when you’re ready.</p>
        <Link href="/member/dashboard" className="inline-flex h-12 px-8 rounded-full bg-[#e8dfd2] text-[#1a1a1a] items-center justify-center">
          Home
        </Link>
      </div>
    </div>
  );
}
