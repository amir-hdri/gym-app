"use client";

import { useState } from "react";
import { PageShell, PageHeader, SectionTitle, MicroLabelFa } from "@/components/twilight/Page";
import { TwilightCard, RowCard, CtaButton, FilterChips, EmptyState } from "@/components/twilight/controls";
import { toast } from "sonner";
import { Send, Bell, Loader2 } from "lucide-react";

const targetOptions = [
  { value: "all", label: "همه اعضا" }, { value: "active", label: "اعضای فعال" },
  { value: "expiring", label: "اشتراک‌های در حال انقضا" }, { value: "coaches", label: "مربیان" },
];

const sentMessages = [
  { t: "تعطیلات نوروز", g: "همه اعضا", d: "۱۴۰۵/۱۲/۲۸", s: "ارسال شده" },
  { t: "یادآوری پرداخت", g: "اعضای فعال", d: "۱۴۰۵/۱۲/۲۰", s: "ارسال شده" },
];

const inputClassName =
  "h-11 w-full rounded-xl border border-[#232934] bg-[#161a22] px-4 text-sm text-white placeholder:text-[#6b7280] focus:border-[#d2c0a5]/50 focus:outline-none";

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
    <PageShell>
      <PageHeader
        title="ارسال اطلاع‌رسانی همگانی"
        subtitle="ارسال پیام به گروه خاص یا همه کاربران"
      />

      <section className="flex flex-col gap-3">
        <SectionTitle>پیام جدید</SectionTitle>
        <TwilightCard className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <MicroLabelFa>گروه دریافت‌کنندگان</MicroLabelFa>
              <FilterChips
                pillId="admin-notifications-filter"
                options={targetOptions.map((o) => o.value)}
                value={target}
                onChange={setTarget}
                labels={Object.fromEntries(targetOptions.map((o) => [o.value, o.label]))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="broadcast-title">
                <MicroLabelFa>عنوان پیام</MicroLabelFa>
              </label>
              <input
                id="broadcast-title"
                type="text"
                placeholder="مثلاً: اطلاعیه تعطیلی باشگاه"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="message">
                <MicroLabelFa>متن پیام</MicroLabelFa>
              </label>
              <textarea
                id="message"
                placeholder="متن پیام خود را وارد کنید..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className={`${inputClassName} h-auto py-3 leading-relaxed`}
              />
            </div>
            <div className="flex justify-end">
              <CtaButton
                onClick={handleSend}
                disabled={!title.trim() || !message.trim() || isSending}
                className="w-auto px-8"
              >
                {isSending ? (
                  <Loader2 strokeWidth={1.75} className="h-4 w-4 animate-spin" />
                ) : (
                  <Send strokeWidth={1.75} className="h-4 w-4" />
                )}
                ارسال پیام
              </CtaButton>
            </div>
          </div>
        </TwilightCard>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>پیام‌های ارسال شده</SectionTitle>
        {sentMessages.length === 0 ? (
          <EmptyState
            icon={<Bell strokeWidth={1.75} className="h-5 w-5" />}
            title="پیام ارسال‌شده‌ای نیست"
            description="هنوز هیچ اطلاع‌رسانی همگانی ارسال نشده است"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {sentMessages.map((item, i) => (
              <RowCard
                key={i}
                icon={<Bell strokeWidth={1.75} className="h-4 w-4" />}
                title={item.t}
                subtitle={`${item.g} - ${item.d}`}
                trailing={<span className="text-xs text-[#d2c0a5]">{item.s}</span>}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
