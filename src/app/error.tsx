"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-[#0c0c0c] text-[#ece6dc] flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <h1 className="font-serif text-[36px]">A pause</h1>
        <p className="text-[#8a847a] mt-2 mb-6 text-sm">Something didn’t load. Try again when you’re ready.</p>
        <button onClick={reset} className="h-12 px-8 rounded-full bg-[#e8dfd2] text-[#1a1a1a]">
          Try again
        </button>
      </div>
    </div>
  );
}
