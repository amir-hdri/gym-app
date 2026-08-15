"use client";

import { useState } from "react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { MessageSquare, Send, User, CheckCheck } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">پیام‌ها</h1>
        <p className="mt-1 text-muted-foreground">گفت‌وگوی مستقیم با مربی شما</p>
      </div>

      <FadeIn>
        <Card glass>
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"><User className="h-5 w-5" /></div><div><CardTitle>دکتر مهسا احمدی</CardTitle><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" />مربی شما</p></div></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>هنوز پیامی از مربی خود دریافت نکرده‌اید</p>
              </div>
            ) : (
              <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto py-2" role="log" aria-live="polite" aria-label="تاریخچه گفت‌وگو">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "athlete" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[86%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${msg.sender === "athlete" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border/70 bg-muted"}`}>
                      <p className="text-sm leading-7">{msg.text}</p>
                      <div className={`mt-1.5 flex items-center gap-1.5 text-xs ${msg.sender === "athlete" ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                        <time dateTime={msg.createdAt}>{formatRelativeTime(msg.createdAt)}</time>
                        {msg.sender === "athlete" && <CheckCheck className="h-3.5 w-3.5" aria-label="ارسال شده" />}
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
                className="bg-white/70 backdrop-blur-sm border-white/30"
              />
              <div className="flex justify-start">
                <Button onClick={handleSend} loading={isSending} disabled={!message.trim()}>
                  <Send className="ml-2 h-4 w-4" />ارسال پیام
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
