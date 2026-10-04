import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { SectionTitle } from "@/components/twilight/Page";
import { FadeIn } from "@/components/animations/FadeIn";

const sections = [
  {
    title: "استفاده از خدمات",
    body: "با ایجاد حساب، متعهد می‌شوید اطلاعات صحیح ارائه دهید، از حساب خود محافظت کنید و از خدمات مطابق قوانین باشگاه استفاده کنید.",
  },
  {
    title: "سلامت و مسئولیت فردی",
    body: "برنامه‌های تمرینی جایگزین تشخیص پزشکی نیستند. پیش از شروع تمرین و در صورت وجود محدودیت جسمانی با پزشک یا مربی خود مشورت کنید.",
  },
  {
    title: "حریم خصوصی",
    body: "اطلاعات پروفایل و فعالیت شما فقط برای ارائه خدمات، شخصی‌سازی برنامه و ارتباط با مربی استفاده می‌شود و بدون مبنای قانونی در اختیار اشخاص ثالث قرار نمی‌گیرد.",
  },
  {
    title: "عضویت و پرداخت",
    body: "شرایط اعتبار، تمدید و لغو هر عضویت پیش از پرداخت نمایش داده می‌شود. ثبت پرداخت به معنی پذیرش شرایط همان طرح است.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0c0e12] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <Link
          href="/auth/register"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#8e98a8] transition-colors hover:text-[#d2c0a5]"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          بازگشت به ثبت‌نام
        </Link>
        <FadeIn>
          <div className="rounded-[32px] border border-white/10 bg-[#10141a] p-6 shadow-2xl shadow-black/50 sm:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d2c0a5]/40 bg-[#202734] text-[#d2c0a5]">
                <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-medium text-white sm:text-3xl">
                  قوانین و مقررات Lumi Wellness
                </h1>
                <p className="mt-1 text-xs text-[#8e98a8]">آخرین به‌روزرسانی: تیر 1405</p>
              </div>
            </div>

            <div className="mt-8 space-y-7">
              {sections.map((s) => (
                <section key={s.title}>
                  <SectionTitle>{s.title}</SectionTitle>
                  <p className="mt-2 text-sm leading-8 text-[#8e98a8]">{s.body}</p>
                </section>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
