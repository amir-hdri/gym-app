"use client";

import { useState } from "react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
  const [selectedAthlete, setSelectedAthlete] = useState("");
  const [message, setMessage] = useState("");
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">پیام‌ها</h1>
        <p className="text-muted-foreground">ارسال پیام به شاگردان</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <FadeIn className={cn("lg:col-span-1", activeConversation !== null && "hidden lg:block")}>
          <Card glass className="overflow-hidden">
            <div className="border-b border-border/60 p-5">
              <h2 className="font-bold">مکالمات</h2>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                <Search className="h-4 w-4" /> جست‌وجو در شاگردان
              </div>
            </div>
            <CardContent className="max-h-[62dvh] overflow-y-auto p-0 lg:max-h-[calc(100dvh-17rem)]">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setActiveConversation(conv.id); setSelectedAthlete(conv.athlete); }}
                  className={cn(
                    "w-full border-b border-border/50 p-4 text-right transition-colors hover:bg-primary/5",
                    activeConversation === conv.id && "bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{conv.athlete}</span>
                    {conv.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{conv.lastMessage}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">{conv.time}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1} className={cn("lg:col-span-2", activeConversation === null && "hidden lg:block")}>
          <Card glass className="flex min-h-[65dvh] flex-col overflow-hidden lg:h-[calc(100dvh-13rem)] lg:min-h-[34rem]">
            <div className="flex items-center gap-3 border-b border-border/60 p-4 md:p-5">
              <button
                onClick={() => { setActiveConversation(null); setSelectedAthlete(""); }}
                className="rounded-xl p-2 text-muted-foreground active:bg-muted lg:hidden"
                aria-label="بازگشت به فهرست مکالمات"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <div>
                <h2 className="font-bold">{selectedAthlete || "انتخاب شاگرد"}</h2>
                {selectedAthlete && <p className="text-xs text-emerald-600">آنلاین</p>}
              </div>
            </div>
            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
              {!selectedAthlete ? (
                <div className="m-auto py-8 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>مخاطبی را از لیست مکالمات انتخاب کنید</p>
                </div>
              ) : (
                <>
                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-muted/25 p-4 md:p-6">
                    <div className="max-w-[85%] self-start rounded-2xl rounded-tr-md bg-card p-3 shadow-sm">
                      <p className="text-sm">سلام {selectedAthlete.split(" ")[0]} جان. تمرینات امروز رو چطور انجام دادی؟</p>
                      <p className="mt-1 text-xs text-muted-foreground">۱۰:۳۰</p>
                    </div>
                    <div className="max-w-[85%] self-end rounded-2xl rounded-tl-md bg-primary/12 p-3 text-foreground">
                      <p className="text-sm">عالی بود استاد. همه حرکت‌ها رو انجام دادم.</p>
                      <p className="mt-1 text-xs text-muted-foreground">۱۱:۱۵</p>
                    </div>
                  </div>
                  <div className="sticky bottom-0 border-t border-border/60 bg-background/90 p-3 backdrop-blur-xl md:p-4">
                    <div className="flex items-end gap-2">
                    <Textarea
                      placeholder="متن پیام خود را وارد کنید..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={1}
                      aria-label={`ارسال پیام جدید به ${selectedAthlete}`}
                      className="max-h-28 min-h-11 resize-none rounded-2xl bg-card"
                    />
                    <Button size="icon" onClick={handleSendMessage} loading={isSending} disabled={!message.trim()} aria-label="ارسال پیام">
                      {!isSending && <Send className="h-4 w-4" />}
                    </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
