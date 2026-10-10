"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { CircleIconButton } from "@/components/twilight/controls";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { ArrowRight, MessageSquare, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const conversations = [
  { id: 1, athlete: "نگار محمدی", lastMessage: "برنامه جدید را چگونه انجام دادم؟", time: "۲ ساعت پیش", unread: true },
  { id: 2, athlete: "سارا احمدی", lastMessage: "میشه برنامه رو تغییر بدیم؟", time: "دیروز", unread: false },
  { id: 3, athlete: "ترانه حسینی", lastMessage: "ممنون از راهنماییتون", time: "۲ روز پیش", unread: false },
];

export default function CoachMessagesPage() {
  // `useSearchParams` suspends on first render — the athlete file deep-links
  // here with `?c=`, so the thread view waits behind a Suspense boundary.
  return (
    <Suspense
      fallback={
        <PageShell>
          <PageHeader title="پیام‌ها" subtitle="ارسال پیام به شاگردان" />
          <p className="py-10 text-center text-sm text-muted-foreground" role="status" aria-live="polite">
            در حال بارگذاری گفت‌وگوها...
          </p>
        </PageShell>
      }
    >
      <CoachMessagesInner />
    </Suspense>
  );
}

function CoachMessagesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("c") ?? "";

  // `?c=` names a thread (athlete pages deep-link here); otherwise the first
  // thread opens so the pane is never empty when threads exist.
  const initialConversation =
    conversations.find((conv) => String(conv.id) === requestedId) ?? conversations[0] ?? null;

  const [selectedAthlete, setSelectedAthlete] = useState(initialConversation?.athlete ?? "");
  const [message, setMessage] = useState("");
  const [activeConversation, setActiveConversation] = useState<number | null>(
    initialConversation?.id ?? null
  );
  const [isSending, setIsSending] = useState(false);

  // The open thread is always addressable: a copied URL reopens the same thread.
  useEffect(() => {
    const current = searchParams.get("c") ?? "";
    const next = activeConversation === null ? "" : String(activeConversation);
    if (next !== current) {
      router.replace(next ? `/coach/messages?c=${next}` : "/coach/messages", { scroll: false });
    }
  }, [activeConversation, router, searchParams]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedAthlete) return;
    setIsSending(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success("پیام ارسال شد");
      setMessage("");
    } catch {
      toast.error("خطا در ارسال پیام");
    } finally {
      setIsSending(false);
    }
  };

  const canSend = message.trim().length > 0 && !isSending;

  return (
    <PageShell>
      <PageHeader title="پیام‌ها" subtitle="ارسال پیام به شاگردان" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={cn("lg:col-span-1", activeConversation !== null && "hidden lg:block")}>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="font-serif text-lg font-normal text-foreground">مکالمات</h2>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs text-muted-foreground">
                <Search className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                جست‌وجو در شاگردان
              </div>
            </div>
            <div className="max-h-[62dvh] divide-y divide-border overflow-y-auto lg:max-h-[calc(100dvh-17rem)]">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setActiveConversation(conv.id); setSelectedAthlete(conv.athlete); }}
                  className={cn(
                    "w-full px-4 py-3.5 text-right transition-colors hover:bg-secondary cursor-pointer",
                    activeConversation === conv.id && "bg-secondary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{conv.athlete}</span>
                    {conv.unread && <span className="h-2 w-2 rounded-full bg-blush-solid" />}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{conv.lastMessage}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{conv.time}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={cn("lg:col-span-2", activeConversation === null && "hidden lg:block")}>
          <div className="flex min-h-[65dvh] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:h-[calc(100dvh-13rem)] lg:min-h-[34rem]">
            <div className="flex items-center gap-3 border-b border-border p-4 md:p-5">
              <button
                onClick={() => { setActiveConversation(null); setSelectedAthlete(""); }}
                className="rounded-xl p-2 text-muted-foreground active:bg-secondary lg:hidden"
                aria-label="بازگشت به فهرست مکالمات"
              >
                <ArrowRight className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <div>
                <h2 className="text-sm font-semibold text-foreground">{selectedAthlete || "انتخاب شاگرد"}</h2>
                {selectedAthlete && <p className="mt-0.5 text-[11px] text-primary">آنلاین</p>}
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-0">
              {!selectedAthlete ? (
                <div className="m-auto py-8 text-center">
                  <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-70" strokeWidth={1.25} />
                  <p className="text-sm text-muted-foreground">مخاطبی را از لیست مکالمات انتخاب کنید</p>
                </div>
              ) : (
                <>
                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-background p-4 md:p-6">
                    <div className="max-w-[85%] self-start rounded-2xl rounded-tr-md border border-border bg-secondary p-3 shadow-sm">
                      <p className="text-sm text-foreground">سلام {selectedAthlete.split(" ")[0]} جان. تمرینات امروز رو چطور انجام دادی؟</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">۱۰:۳۰</p>
                    </div>
                    <div className="max-w-[85%] self-end rounded-2xl rounded-tl-md bg-primary p-3 shadow-sm">
                      <p className="text-sm text-primary-foreground">عالی بود استاد. همه حرکت‌ها رو انجام دادم.</p>
                      <p className="mt-1 text-[11px] text-primary-foreground/60">۱۱:۱۵</p>
                    </div>
                  </div>
                  <div className="sticky bottom-0 border-t border-border bg-popover/95 p-3 backdrop-blur-xl md:p-4">
                    <div className="flex items-end gap-2">
                      <Textarea
                        placeholder="متن پیام خود را وارد کنید..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={1}
                        aria-label={`ارسال پیام جدید به ${selectedAthlete}`}
                        className="max-h-28 min-h-11 resize-none rounded-2xl"
                      />
                      <CircleIconButton
                        label="ارسال پیام"
                        onClick={canSend ? handleSendMessage : undefined}
                        className={cn(!canSend && "cursor-not-allowed opacity-40")}
                      >
                        <Send className="h-4 w-4" strokeWidth={1.75} />
                      </CircleIconButton>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
