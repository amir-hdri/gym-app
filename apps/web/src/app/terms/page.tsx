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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <Link
          href="/auth/register"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          بازگشت به ثبت‌نام
        </Link>
        <FadeIn>
          <div className="rounded-[32px] border border-border bg-popover p-6 shadow-2xl shadow-black/50 sm:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-secondary text-primary">
                <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
                  قوانین و مقررات Lumi Wellness
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">آخرین به‌روزرسانی: تیر 1405</p>
              </div>
            </div>

            <div className="mt-8 space-y-7">
              {sections.map((s) => (
                <section key={s.title}>
                  <SectionTitle>{s.title}</SectionTitle>
                  <p className="mt-2 text-sm leading-8 text-muted-foreground">{s.body}</p>
                </section>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
