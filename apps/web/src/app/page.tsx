"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { CtaButton } from "@/components/twilight/controls";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";
import { MicroLabel } from "@/components/twilight/Page";
import { LumiWordmark } from "@/components/auth/AuthLayout";
import { Activity, Users, MessageCircle, Calendar, Heart, Sparkles, ChevronDown, ArrowLeft, Star, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/animations/ScrollReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

function LandingNavigation({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <header className="sticky inset-x-0 top-0 z-30 px-4 py-3">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-border bg-background/90 px-4 py-3 backdrop-blur-xl" aria-label="ناوبری صفحه اصلی">
        <a href="#top" className="flex items-center" aria-label="Lumi Wellness">
          <LumiWordmark />
        </a>
        <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#experience" className="transition-colors hover:text-foreground">تجربه تمرین</a>
          <a href="#schedule" className="transition-colors hover:text-foreground">برنامه هفتگی</a>
          <a href="#coaches" className="transition-colors hover:text-foreground">مربیان</a>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogin}
            className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide text-foreground transition-colors hover:bg-secondary"
          >
            ورود
          </button>
          <CtaButton onClick={onRegister} className="w-auto px-5 py-2.5 text-xs">
            عضویت
          </CtaButton>
        </div>
      </nav>
    </header>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Activity,
      title: "برنامه تمرینی هوشمند",
      desc: "برنامه‌های تمرینی شخصی‌سازی شده متناسب با هدف شما",
    },
    {
      icon: Heart,
      title: "پیگیری سلامت",
      desc: "مانیتورینگ عملکرد، وزن و پیشرفت روزانه",
    },
    {
      icon: Users,
      title: "مربی اختصاصی",
      desc: "ارتباط مستقیم با مربیان متخصص و با تجربه",
    },
    {
      icon: Calendar,
      title: "مدیریت اشتراک",
      desc: "تمدید خودکار، یادآوری و گزارش هزینه‌ها",
    },
    {
      icon: MessageCircle,
      title: "چت و اعلانات",
      desc: "ارتباط سریع با باشگاه و دریافت اخبار و تخفیف‌ها",
    },
    {
      icon: Sparkles,
      title: "محیط زنانه اختصاصی",
      desc: "فضای اختصاصی و حرفه‌ای ویژه بانوان عزیز",
    },
  ];

  return (
    <section id="experience" className="cv-below-fold relative px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal direction="none" className="mb-14 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blush/30 bg-blush/10 px-4 py-1.5 text-sm font-medium text-blush">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            تجربه‌ای ساخته‌شده برای تمرین
          </span>
          <h2 className="mt-2 font-serif text-3xl font-normal text-foreground md:text-4xl">
            از برنامه تا پیشرفت، کنار تو
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            هر روز دقیقاً بدان چه تمرینی داری، مربی چه بازخوردی داده و چقدر به هدفت نزدیک شده‌ای.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="group h-full rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-border">
                <div className={i % 2 === 0
                  ? "mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-blush/30 bg-blush/10 text-blush"
                  : "mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-cream/40 bg-cream/20 text-primary"}>
                  <f.icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                </div>
                <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WeeklyExperienceSection() {
  const sessions = [
    { day: "شنبه", title: "قدرت پایین‌تنه", meta: "45 دقیقه · مربی مهسا", active: true },
    { day: "دوشنبه", title: "پیلاتس و تعادل", meta: "35 دقیقه · استودیو 2" },
    { day: "چهارشنبه", title: "هوازی ریتمیک", meta: "40 دقیقه · گروه بانوان" },
  ];
  return (
    <section id="schedule" className="cv-below-fold px-4 py-20">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[26px] border border-border bg-card p-6 text-foreground sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">برنامه همین هفته</p>
          <h2 className="mt-3 font-serif text-[22px] font-normal leading-tight md:text-2xl">تمرین‌هایی که با زندگی تو هماهنگ‌اند.</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">برنامه را ببین، حضور را ثبت کن و بازخورد مربی را همان‌جا دریافت کن.</p>
          <div className="mt-7 space-y-3">
            {sessions.map((session) => (
              <div key={session.day} className={`flex items-center gap-4 rounded-xl border p-4 ${session.active ? "border-blush/30 bg-blush/10" : "border-border bg-card"}`}>
                <div className="w-14 text-xs font-bold text-foreground">{session.day}</div>
                <div className="h-9 w-px bg-border" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{session.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground" dir="rtl">{session.meta}</p>
                </div>
                <CheckCircle2 className={`h-5 w-5 ${session.active ? "text-blush" : "text-muted-foreground"}`} strokeWidth={1.75} />
              </div>
            ))}
          </div>
        </div>
        <div id="coaches" className="rounded-[26px] border border-border bg-card p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">مربی همراه، نه فقط برنامه</p>
              <h2 className="mt-3 font-serif text-[22px] font-normal text-foreground md:text-2xl">مهسا احمدی</h2>
              <p className="mt-1 text-sm text-muted-foreground">مربی قدرت و تناسب اندام بانوان</p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-gradient-to-br from-secondary to-card">
              <span className="font-serif text-sm text-primary">م‌ا</span>
            </div>
          </div>
          <blockquote className="mt-6 rounded-xl border border-border bg-card p-4 text-sm leading-7 text-muted-foreground">
            «هر برنامه بر اساس توان امروز تو نوشته می‌شود، نه یک نسخه آماده برای همه.»
          </blockquote>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-card p-3"><p className="text-sm font-bold text-foreground">+8 سال</p><p className="mt-1 text-xs text-muted-foreground">تجربه</p></div>
            <div className="rounded-xl bg-card p-3"><p className="text-sm font-bold text-foreground">+120</p><p className="mt-1 text-xs text-muted-foreground">ورزشکار</p></div>
            <div className="rounded-xl bg-card p-3"><p className="flex items-center justify-center gap-1 text-sm font-bold text-foreground">4.9 <Star className="h-4 w-4 fill-primary text-primary" /></p><p className="mt-1 text-xs text-muted-foreground">رضایت</p></div>
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm">
            <MessageCircle className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <span className="flex-1 text-sm text-muted-foreground">میانگین پاسخ‌گویی مربی کمتر از 2 ساعت</span>
            <ArrowLeft className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { icon: Users, value: 450, suffix: "+", label: "ورزشکار فعال" },
    { icon: Activity, value: 12, suffix: "+", label: "مربی متخصص" },
    { icon: Heart, value: 98, suffix: "%", label: "رضایت مشتریان" },
    { icon: Sparkles, value: 5000, suffix: "+", label: "جلسه تمرینی" },
  ];

  return (
    <section className="cv-below-fold relative px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08}>
              <div className="flex flex-col items-center justify-between rounded-2xl border border-border bg-card p-4 text-center">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cream/40 bg-cream/20">
                  <stat.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <div className="font-sans text-2xl font-normal tabular-nums tracking-tight text-foreground md:text-3xl">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroSection({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <section id="top" className="relative flex min-h-[92svh] items-center px-4 py-16 lg:py-28">
      <GymBackdrop className="absolute inset-0" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <div className="text-right">
          {/*
           * Above-fold hero content paints statically (no entrance Reveal):
           * the H1/CTA row is the LCP element and every millisecond of
           * animation delay lands directly on the score.
           */}
          <p className="mb-6 inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border border-blush-fixed/30 bg-blush-fixed/10 px-4 py-1.5 text-xs font-medium text-blush-fixed sm:text-sm">
            <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            بهترین پلتفرم مدیریت باشگاه بانوان
          </p>

          <h1 className="mb-5 font-serif text-[2.1rem] font-medium leading-[1.5] tracking-tight text-logo-ink-inverse sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block">حرکت، قدرت،</span>
            <span className="block text-blush-fixed">نسخه بهتر تو</span>
          </h1>

          <p className="mb-8 max-w-xl text-[15px] leading-8 text-muted-foreground md:text-lg">
            Lumi Wellness، باشگاه دیجیتال اختصاصی بانوان برای برنامه تمرینی شخصی، ارتباط مستقیم با مربی و دیدن پیشرفت واقعی در هر روز.
          </p>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-start">
            <CtaButton onClick={onLogin} className="w-full whitespace-nowrap sm:w-auto sm:min-w-40">
              <Heart className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              ورود اعضا
            </CtaButton>
            <CtaButton onClick={onRegister} variant="orange" className="w-full whitespace-nowrap sm:w-auto sm:min-w-40">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              عضویت ورزشکار یا مربی
            </CtaButton>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[30rem]">
          {/* Soft blush radial glow behind the dark-signature hero card (both themes) */}
          <div aria-hidden="true" className="pointer-events-none absolute -inset-10 rounded-full bg-blush-fixed/15 blur-3xl" />
          {/* Reference hero card: GymBackdrop + content overlay */}
          <div className="relative overflow-hidden rounded-[26px] border border-logo-ink-inverse/10 shadow-2xl shadow-black/50">
            <div className="h-[380px] w-full">
              <GymBackdrop />
            </div>
            <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cream-fixed">
                  امروز، یک قدم جلوتر
                </p>
                <p className="mt-2 font-serif text-4xl font-medium text-logo-ink-inverse" dir="ltr">78%</p>
                <p className="mt-1 text-xs text-logo-ink-inverse/70">فعالیت روزانه تکمیل شده</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["حرکت", "380 کالری"],
                  ["تمرین", "42 دقیقه"],
                  ["تداوم", "5 روز"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-logo-ink-inverse/10 bg-scrim/30 p-3 backdrop-blur-sm">
                    <span className="mb-2 block h-1.5 w-6 rounded-full bg-primary" />
                    <p className="text-xs text-logo-ink-inverse/70">{label}</p>
                    <p className="mt-1 text-xs font-bold text-logo-ink-inverse">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-4 rounded-2xl border border-border bg-card px-4 py-3 text-right shadow-2xl shadow-black/50">
            <p className="text-xs text-muted-foreground">همراه با مربی</p>
            <p className="mt-1 text-xs font-bold text-foreground">برنامه اختصاصی تو</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.75} />
      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      switch (user.role) {
        case "admin":
          router.replace("/admin");
          break;
        case "coach":
          router.replace("/coach");
          break;
        case "athlete":
          router.replace("/athlete");
          break;
        default:
          router.replace("/auth/login");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isAuthenticated && user) {
    const panelHref = user.role === "admin" ? "/admin" : user.role === "coach" ? "/coach" : user.role === "athlete" ? "/athlete" : "/auth/login";
    const roleLabel = user.role === "admin" ? "پنل ادمین" : user.role === "coach" ? "پنل مربی" : "پنل ورزشکار";
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
        <GymBackdrop className="absolute inset-0" />
        <div className="relative z-10 w-full max-w-md rounded-[32px] border border-border bg-popover p-8 text-center shadow-2xl shadow-black/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/40 bg-secondary text-primary"><CheckCircle2 className="h-6 w-6" strokeWidth={1.75} /></div>
          <h1 className="mt-4 font-serif text-2xl font-medium text-foreground">خوش آمدی، {user.firstName || user.email}!</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">حساب شما فعال است. می‌توانی مستقیم به پنل بروی یا با حساب دیگری وارد شوی.</p>
          <div className="mt-6 flex flex-col gap-3">
            <CtaButton onClick={() => router.push(panelHref)} className="text-sm">ورود به {roleLabel}</CtaButton>
            <CtaButton variant="ghost" onClick={() => { logout(); router.push("/auth/login"); }} className="text-sm">خروج و ورود با حساب دیگر</CtaButton>
            <Link href="/auth/login" className="text-xs text-muted-foreground hover:text-foreground">رفتن به صفحه ورود</Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">اگر این حساب شما نیست، گزینه خروج را بزن.</p>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <LandingNavigation onLogin={() => router.push("/auth/login")} onRegister={() => router.push("/auth/register")} />
      <HeroSection
        onLogin={() => router.push("/auth/login")}
        onRegister={() => router.push("/auth/register")}
      />
      <StatsSection />
      <FeaturesSection />
      <WeeklyExperienceSection />

      {/* Footer */}
      <footer className="relative border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <LumiWordmark />
              </div>
              <p className="mt-3 max-w-[28ch] text-sm leading-7 text-muted-foreground">
                پلتفرم مدیریت هوشمند باشگاه بانوان — برنامه تمرینی، حضور و پیشرفت در یک وب‌اپ سریع.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <a href="https://instagram.com/gymapp.ir" target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>
                </a>
                <a href="https://t.me/gymapp_ir" target="_blank" rel="noopener noreferrer" aria-label="تلگرام" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 5 4 12l5 2 8-7-5 8 2 4 3-13z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">محصول</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#experience" className="hover:text-foreground">تجربه تمرین</a></li>
                <li><a href="#schedule" className="hover:text-foreground">برنامه هفتگی</a></li>
                <li><a href="#coaches" className="hover:text-foreground">مربیان</a></li>
                <li><Link href="/auth/register" className="hover:text-foreground">عضویت</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">پشتیبانی</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground">قوانین و حریم‌خصوصی</Link></li>
                <li><Link href="/auth/forgot-password" className="hover:text-foreground">بازیابی رمز</Link></li>
                <li><a href="mailto:support@gymapp.ir" dir="ltr" className="hover:text-foreground">support@gymapp.ir</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">دسترسی سریع</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth/login" className="hover:text-foreground">ورود اعضا</Link></li>
                <li><span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-primary">● وب‌اپ نصب‌پذیر (PWA)</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© 1404 Lumi Wellness — تمامی حقوق محفوظ است</p>
            <MicroLabel>BUILT FOR MOBILE · v1.0</MicroLabel>
          </div>
        </div>
      </footer>
    </main>
  );
}
