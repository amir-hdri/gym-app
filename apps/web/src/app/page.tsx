"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { Activity, Users, MessageCircle, Calendar, Heart, Sparkles, ChevronDown, ArrowLeft, Star, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/animations/ScrollReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ActivityRings } from "@/components/ui/ActivityRings";
import { LumiLogo } from "@/components/ui/LumiLogo";

function FloatingBlur() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[8%] top-[-12%] h-[520px] w-[520px] rounded-full bg-brand-2/[0.07] blur-[100px]" />
      <div className="absolute right-[6%] top-[18%] h-[420px] w-[420px] rounded-full bg-activity-exercise/[0.06] blur-[90px]" />
      <div className="absolute bottom-[-12%] right-[12%] h-[460px] w-[460px] rounded-full bg-activity-stand/[0.07] blur-[110px]" />
      <div className="absolute bottom-[10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-white/[0.02] blur-[80px]" />
    </div>
  );
}

function LandingNavigation({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <header className="sticky inset-x-0 top-0 z-30 px-4 py-3">
      <nav className="liquid-glass-header mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)]" aria-label="ناوبری صفحه اصلی">
        <a href="#top" className="flex items-center text-foreground" aria-label="Lumi Wellness"><LumiLogo size="xs" variant="auto" showSubtitle={false} showDivider={false} /></a>
        <div className="hidden items-center gap-6 text-sm font-medium text-[#98989D] md:flex">
          <a href="#experience" className="transition-colors hover:text-foreground">تجربه تمرین</a>
          <a href="#schedule" className="transition-colors hover:text-foreground">برنامه هفتگی</a>
          <a href="#coaches" className="transition-colors hover:text-foreground">مربیان</a>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onLogin} className="rounded-full px-5 font-bold shadow-sm">ورود</Button>
          <Button size="sm" onClick={onRegister} className="rounded-full px-5 font-bold shadow-[0_4px_16px_hsl(var(--brand)/0.3)]">عضویت</Button>
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
    <section id="experience" className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal direction="none" className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Sparkles className="h-4 w-4" />
             تجربه‌ای ساخته‌شده برای تمرین
          </span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl text-gradient-brand">
            از برنامه تا پیشرفت، کنار تو
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            هر روز دقیقاً بدان چه تمرینی داری، مربی چه بازخوردی داده و چقدر به هدفت نزدیک شده‌ای.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="liquid-glass-card group relative h-full overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent opacity-60" />
                <div className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_4px_16px_hsl(var(--brand)/0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
                  <f.icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                </div>
                <h3 className="relative mb-1.5 text-[15px] font-semibold tracking-tight text-white">{f.title}</h3>
                <p className="relative text-sm leading-relaxed text-[#98989D]">{f.desc}</p>
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
    { day: "شنبه", title: "قدرت پایین‌تنه", meta: "۴۵ دقیقه · مربی مهسا", active: true },
    { day: "دوشنبه", title: "پیلاتس و تعادل", meta: "۳۵ دقیقه · استودیو ۲" },
    { day: "چهارشنبه", title: "هوازی ریتمیک", meta: "۴۰ دقیقه · گروه بانوان" },
  ];
  return (
    <section id="schedule" className="px-4 py-20">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative overflow-hidden rounded-[1.75rem] liquid-glass p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.10)] border-white/10 sm:p-8">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-[60px]" />
          <p className="text-xs font-bold tracking-widest text-activity-exercise">برنامه همین هفته</p>
          <h2 className="mt-3 text-[22px] font-bold leading-tight md:text-2xl">تمرین‌هایی که با زندگی تو هماهنگ‌اند.</h2>
          <p className="mt-3 leading-7 text-white/70 text-sm">برنامه را ببین، حضور را ثبت کن و بازخورد مربی را همان‌جا دریافت کن.</p>
          <div className="mt-7 space-y-3">
            {sessions.map((session) => (
              <div key={session.day} className={`flex items-center gap-4 rounded-xl p-4 ${session.active ? "bg-primary-solid text-white" : "bg-white/[.08]"}`}>
                <div className="w-14 text-xs font-bold">{session.day}</div><div className="h-9 w-px bg-white/20" /><div className="flex-1"><p className="text-sm font-semibold">{session.title}</p><p className="mt-1 text-xs text-white/70">{session.meta}</p></div><CheckCircle2 className="h-5 w-5" />
              </div>
            ))}
          </div>
        </div>
        <div id="coaches" className="liquid-glass-card rounded-[1.75rem] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="fitness-kicker">مربی همراه، نه فقط برنامه</p><h2 className="mt-3 text-[22px] font-bold md:text-2xl">مهسا احمدی</h2><p className="mt-1 text-sm text-muted-foreground">مربی قدرت و تناسب اندام بانوان</p></div><div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-solid text-sm font-bold text-white">م‌ا</div></div>
          <blockquote className="mt-6 rounded-xl border border-border/60 bg-card p-4 text-sm leading-7">«هر برنامه بر اساس توان امروز تو نوشته می‌شود، نه یک نسخه آماده برای همه.»</blockquote>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-muted p-3"><p className="text-sm font-bold">+۸ سال</p><p className="mt-1 text-xs text-muted-foreground">تجربه</p></div>
            <div className="rounded-xl bg-muted p-3"><p className="text-sm font-bold">+۱۲۰</p><p className="mt-1 text-xs text-muted-foreground">ورزشکار</p></div>
            <div className="rounded-xl bg-muted p-3"><p className="flex items-center justify-center gap-1 text-sm font-bold">۴.۹ <Star className="h-4 w-4 fill-amber-500 text-amber-500" /></p><p className="mt-1 text-xs text-muted-foreground">رضایت</p></div>
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-primary/10 p-4 text-sm"><MessageCircle className="h-5 w-5 text-primary" /><span className="flex-1 text-sm">میانگین پاسخ‌گویی مربی کمتر از ۲ ساعت</span><ArrowLeft className="h-4 w-4 text-primary" /></div>
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
    <section className="relative py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 mb-3">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gradient-brand">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
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
    <section id="top" className="relative flex min-h-[90vh] items-center px-4 py-28">
      <FloatingBlur />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
        <div className="text-center lg:text-right">
          <Reveal
            direction="none"
            scale
            duration={0.4}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-bold text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            بهترین پلتفرم مدیریت باشگاه بانوان
          </Reveal>

          <h1 className="mb-5 text-4xl font-black leading-[1.2] tracking-tight md:text-6xl lg:text-7xl">
            <span className="block">حرکت، قدرت،</span>
            <span className="block text-gradient-brand">نسخه بهتر تو</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-base leading-8 text-muted-foreground md:text-lg lg:mx-0">
            Lumi Wellness، باشگاه دیجیتال اختصاصی بانوان برای برنامه تمرینی شخصی، ارتباط مستقیم با مربی و دیدن پیشرفت واقعی در هر روز.
          </p>

          <Reveal
            direction="up"
            offset={12}
            duration={0.4}
            delay={0.1}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <Button
              size="lg"
              className="w-full px-8 shadow-lg sm:w-auto"
              onClick={onLogin}
            >
              <Heart className="h-4 w-4" />
              ورود اعضا
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full px-8 sm:w-auto"
              onClick={onRegister}
            >
              <Sparkles className="h-4 w-4" />
              عضویت ورزشکار یا مربی
            </Button>
          </Reveal>
        </div>

        <Reveal
          direction="up"
          offset={16}
          scale
          duration={0.5}
          delay={0.15}
          className="relative mx-auto w-full max-w-[30rem]"
        >
          <div className="absolute -inset-10 rounded-full bg-gradient-to-br from-brand-2/[0.12] via-transparent to-activity-stand/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.2rem] liquid-glass p-6 text-white shadow-[0_32px_80px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] md:p-8 border-white/10">
            <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-brand-2/20 blur-[80px]" />
            <div className="absolute -right-12 bottom-0 h-48 w-48 rounded-full bg-activity-stand/15 blur-[70px]" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-activity-exercise">امروز، یک قدم جلوتر</p>
                <p className="mt-2 text-3xl font-black">۷۸٪</p>
                 <p className="mt-1 text-xs text-white/70">فعالیت روزانه تکمیل شده</p>
              </div>
              <ActivityRings className="h-36 w-36 md:h-44 md:w-44" progress={[88, 68, 78]} />
            </div>
            <div className="relative mt-6 grid grid-cols-3 gap-2">
              {[
                ["حرکت", "۳۸۰ کالری", "bg-activity-move"],
                ["تمرین", "۴۲ دقیقه", "bg-activity-exercise"],
                ["تداوم", "۵ روز", "bg-activity-stand"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-2xl bg-white/[.07] p-3">
                  <span className={`mb-2 block h-1.5 w-6 rounded-full ${color}`} />
                   <p className="text-xs text-white/70">{label}</p>
                  <p className="mt-1 text-xs font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-6 -right-4 rounded-2xl liquid-glass-card px-4 py-3 text-right shadow-[0_12px_32px_rgba(0,0,0,0.45)] border-white/10">
             <p className="text-xs text-muted-foreground">همراه با مربی</p>
            <p className="text-xs font-black">برنامه اختصاصی تو</p>
          </div>
        </Reveal>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6 text-muted-foreground/40" />
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
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CheckCircle2 className="h-6 w-6" /></div>
          <h1 className="mt-4 text-xl font-black">خوش آمدی، {user.firstName || user.email}!</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">حساب شما فعال است. می‌توانی مستقیم به پنل بروی یا با حساب دیگری وارد شوی.</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button size="lg" className="w-full rounded-full" onClick={() => router.push(panelHref)}>ورود به {roleLabel} →</Button>
            <Button variant="outline" size="lg" className="w-full rounded-full" onClick={() => { logout(); router.push("/auth/login"); }}>خروج و ورود با حساب دیگر</Button>
            <Link href="/auth/login" className="text-xs text-muted-foreground hover:text-foreground">رفتن به صفحه ورود</Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">اگر این حساب شما نیست، گزینه خروج را بزن.</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main id="main" className="relative min-h-screen overflow-hidden bg-background">
        <LandingNavigation onLogin={() => router.push("/auth/login")} onRegister={() => router.push("/auth/register")} />
        <HeroSection
          onLogin={() => router.push("/auth/login")}
          onRegister={() => router.push("/auth/register")}
        />
        <StatsSection />
        <FeaturesSection />
        <WeeklyExperienceSection />

        {/* Footer — professional, practical, no island icon */}
        <footer className="relative border-t border-border/50 bg-card/40 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 text-foreground">
                  <LumiLogo size="xs" variant="auto" showSubtitle={false} showDivider={false} />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                </div>
                <p className="mt-3 max-w-[28ch] text-sm leading-7 text-muted-foreground">
                  پلتفرم مدیریت هوشمند باشگاه بانوان — برنامه تمرینی، حضور و پیشرفت در یک وب‌اپ سریع.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <a href="https://instagram.com/gymapp.ir" target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام" className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>
                  </a>
                  <a href="https://t.me/gymapp_ir" target="_blank" rel="noopener noreferrer" aria-label="تلگرام" className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 5 4 12l5 2 8-7-5 8 2 4 3-13z"/></svg>
                  </a>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold">محصول</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li><a href="#experience" className="hover:text-foreground">تجربه تمرین</a></li>
                  <li><a href="#schedule" className="hover:text-foreground">برنامه هفتگی</a></li>
                  <li><a href="#coaches" className="hover:text-foreground">مربیان</a></li>
                  <li><Link href="/auth/register" className="hover:text-foreground">عضویت</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold">پشتیبانی</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/terms" className="hover:text-foreground">قوانین و حریم‌خصوصی</Link></li>
                  <li><Link href="/auth/forgot-password" className="hover:text-foreground">بازیابی رمز</Link></li>
                  <li><a href="mailto:support@gymapp.ir" className="hover:text-foreground">support@gymapp.ir</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold">دسترسی سریع</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/auth/login" className="hover:text-foreground">ورود اعضا</Link></li>
                  <li><span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">● وب‌اپ نصب‌پذیر (PWA)</span></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row">
              <p>© ۱۴۰۴ Lumi Wellness — تمامی حقوق محفوظ است</p>
              <p className="flex items-center gap-2">ساخته‌شده برای موبایل • <span className="rounded-full bg-muted px-2 py-0.5">v1.0</span></p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
