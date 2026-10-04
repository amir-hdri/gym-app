"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { MessageSquare, Send, User, CheckCheck } from "lucide-react";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { EmptyState } from "@/components/twilight/controls";

type ChatMessage = { id: number; sender: "coach" | "athlete"; text: string; createdAt: string; unread?: boolean };

const initialMessages: ChatMessage[] = [
  { id: 1, sender: "coach", text: "برنامه جدید را برایت تنظیم کردم. لطفاً از فردا شروع کن.", createdAt: "2026-07-21T09:30:00+03:30" },
  { id: 2, sender: "athlete", text: "ممنون مربی. برنامه را دیدم و آماده‌ام شروع کنم.", createdAt: "2026-07-21T10:05:00+03:30" },
  { id: 3, sender: "coach", text: "سلام سارا جان. تمرینات امروز را چطور انجام دادی؟", createdAt: "2026-07-22T09:30:00+03:30", unread: true },
];

export default function AthleteMessagesPage() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(initialMessages);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setMessages((current) => [
        ...current,
        { id: Date.now(), sender: "athlete", text: message.trim(), createdAt: new Date().toISOString() },
      ]);
      toast.success("پیام ارسال شد");
      setMessage("");
    } catch {
      toast.error("خطا در ارسال پیام");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="پیام‌ها"
        subtitle="گفت‌وگوی مستقیم با مربی شما"
      />

      <div className="overflow-hidden rounded-2xl border border-[#232934] bg-[#161a22]">
        <div className="border-b border-[#1e2430] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2c3444] bg-[#202632] text-[#d2c0a5]">
              <User className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">دکتر مهسا احمدی</h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[#8e98a8]">
                <span className="h-2 w-2 rounded-full bg-[#d2c0a5]" />مربی شما
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {messages.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-6 w-6" strokeWidth={1.75} />}
              title="هنوز پیامی از مربی خود دریافت نکرده‌اید"
            />
          ) : (
            <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto py-2" role="log" aria-live="polite" aria-label="تاریخچه گفت‌وگو">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "athlete" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[86%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${msg.sender === "athlete" ? "rounded-br-md bg-primary text-[#121417]" : "rounded-bl-md border border-[#232934] bg-[#1a202a] text-white"}`}>
                    <p className="text-sm leading-7">{msg.text}</p>
                    <div className={`mt-1.5 flex items-center gap-1.5 text-xs ${msg.sender === "athlete" ? "text-[#121417]/75" : "text-[#8e98a8]"}`}>
                      <time dateTime={msg.createdAt}>{formatRelativeTime(msg.createdAt)}</time>
                      {msg.sender === "athlete" && <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-label="ارسال شده" />}
                      {msg.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="خوانده نشده" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Textarea
              aria-label="متن پیام"
              placeholder="پاسخ خود را بنویسید..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="rounded-xl border border-[#232934] bg-[#1a202a] px-4 text-sm text-white placeholder:text-[#6b7280] focus:border-[#d2c0a5]/50 focus:outline-none"
            />
            <div className="flex justify-start">
              <Button onClick={handleSend} loading={isSending} disabled={!message.trim()}>
                <Send className="ml-2 h-4 w-4" strokeWidth={1.75} />ارسال پیام
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
