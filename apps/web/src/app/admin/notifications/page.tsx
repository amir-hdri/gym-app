"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { FadeIn } from "@/components/animations/FadeIn";
import { toast } from "sonner";
import { Send, Bell } from "lucide-react";

const targetOptions = [
  { value: "all", label: "همه اعضا" }, { value: "active", label: "اعضای فعال" },
  { value: "expiring", label: "اشتراک‌های در حال انقضا" }, { value: "coaches", label: "مربیان" },
];

export default function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setIsSending(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("پیام با موفقیت ارسال شد");
      setTitle(""); setMessage(""); setTarget("all");
    } catch {
      toast.error("خطا در ارسال پیام");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ارسال اطلاع‌رسانی همگانی</h1>
        <p className="text-muted-foreground">ارسال پیام به گروه خاص یا همه کاربران</p>
      </div>

      <FadeIn>
        <Card glass>
          <CardHeader><CardTitle>پیام جدید</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>گروه دریافت‌کنندگان</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {targetOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Input label="عنوان پیام" placeholder="مثلاً: اطلاعیه تعطیلی باشگاه" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/70 backdrop-blur-sm border-white/30" />
            <div className="space-y-1.5">
              <Label htmlFor="message">متن پیام</Label>
              <Textarea
                id="message"
                placeholder="متن پیام خود را وارد کنید..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="bg-white/70 backdrop-blur-sm border-white/30"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSend} loading={isSending} disabled={!title.trim() || !message.trim()}>
                <Send className="ml-2 h-4 w-4" />
                ارسال پیام
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card glass>
          <CardHeader><CardTitle>پیام‌های ارسال شده</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[{ t: "تعطیلات نوروز", g: "همه اعضا", d: "۱۴۰۵/۱۲/۲۸", s: "ارسال شده" },
              { t: "یادآوری پرداخت", g: "اعضای فعال", d: "۱۴۰۵/۱۲/۲۰", s: "ارسال شده" }].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white/40 p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{item.t}</p>
                    <p className="text-xs text-muted-foreground">{item.g} - {item.d}</p>
                  </div>
                </div>
                <span className="text-xs text-green-600">{item.s}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
