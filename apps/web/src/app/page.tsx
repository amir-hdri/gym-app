"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { Activity, Users, MessageCircle, Calendar, Heart, Sparkles, Dumbbell, ChevronDown, ArrowLeft, Star, CheckCircle2 } from "lucide-react";
import { ScrollReveal, StaggerScroll, StaggerScrollItem } from "@/components/animations/ScrollReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ActivityRings } from "@/components/ui/ActivityRings";

function LoadingScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="gradient-brand flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Dumbbell className="h-7 w-7 text-white" />
        </motion.div>
        <p className="text-sm text-muted-foreground animate-pulse">در حال بارگذاری...</p>
      </div>
    </div>
  );
}

function FloatingBlur() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-activity-stand/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[10%] h-[400px] w-[400px] rounded-full bg-activity-move/10 blur-[100px]" />
    </div>
  );
}

function LandingNavigation({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 px-4 py-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/60 bg-background/75 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10" aria-label="ناوبری صفحه اصلی">
        <a href="#top" className="flex items-center gap-2 font-black"><span className="gradient-brand flex h-9 w-9 items-center justify-center rounded-xl text-white">ج</span>جیم‌آپ</a>
        <div className="hidden items-center gap-6 text-sm font-bold text-muted-foreground md:flex">
          <a href="#experience" className="transition-colors hover:text-primary">تجربه تمرین</a>
          <a href="#schedule" className="transition-colors hover:text-primary">برنامه هفتگی</a>
          <a href="#coaches" className="transition-colors hover:text-primary">مربیان</a>
        </div>
        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={onLogin}>ورود</Button><Button size="sm" onClick={onRegister}>عضویت</Button></div>
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
        <ScrollReveal direction="none" className="text-center mb-14">
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
        </ScrollReveal>

        <StaggerScroll className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {features.map((f) => (
            <StaggerScrollItem key={f.title}>
              <div className="group h-full rounded-[1.6rem] border border-white/60 bg-white/70 p-6 shadow-[0_20px_60px_-40px_rgba(76,23,72,.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg dark:border-white/10 dark:bg-white/[.055]">
                <div className="gradient-brand mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </StaggerScrollItem>
          ))}
        </StaggerScroll>
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
        <div className="rounded-[2rem] bg-brand-surface p-6 text-white shadow-2xl sm:p-8">
          <p className="text-xs font-black text-activity-exercise">برنامه همین هفته</p>
          <h2 className="mt-3 text-3xl font-black">تمرین‌هایی که با زندگی تو هماهنگ‌اند.</h2>
          <p className="mt-3 leading-8 text-white/70">برنامه را ببین، حضور را ثبت کن و بازخورد مربی را همان‌جا دریافت کن.</p>
          <div className="mt-7 space-y-3">
            {sessions.map((session) => (
              <div key={session.day} className={`flex items-center gap-4 rounded-2xl p-4 ${session.active ? "bg-primary text-white" : "bg-white/[.08]"}`}>
                <div className="w-14 text-xs font-black">{session.day}</div><div className="h-9 w-px bg-white/20" /><div className="flex-1"><p className="font-bold">{session.title}</p><p className="mt-1 text-xs text-white/70">{session.meta}</p></div><CheckCircle2 className="h-5 w-5" />
              </div>
            ))}
          </div>
        </div>
        <div id="coaches" className="fitness-panel p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="fitness-kicker">مربی همراه، نه فقط برنامه</p><h2 className="mt-3 text-3xl font-black">مهسا احمدی</h2><p className="mt-1 text-muted-foreground">مربی قدرت و تناسب اندام بانوان</p></div><div className="gradient-brand flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white">م‌ا</div></div>
          <blockquote className="mt-8 rounded-2xl border border-border/60 bg-card p-5 text-base leading-8">«هر برنامه بر اساس توان امروز تو نوشته می‌شود، نه یک نسخه آماده برای همه.»</blockquote>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-muted p-3"><p className="font-black">+۸ سال</p><p className="mt-1 text-xs text-muted-foreground">تجربه</p></div>
            <div className="rounded-2xl bg-muted p-3"><p className="font-black">+۱۲۰</p><p className="mt-1 text-xs text-muted-foreground">ورزشکار</p></div>
            <div className="rounded-2xl bg-muted p-3"><p className="flex items-center justify-center gap-1 font-black">۴.۹ <Star className="h-4 w-4 fill-warning text-warning" /></p><p className="mt-1 text-xs text-muted-foreground">رضایت</p></div>
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-primary/10 p-4 text-sm"><MessageCircle className="h-5 w-5 text-primary" /><span className="flex-1">میانگین پاسخ‌گویی مربی کمتر از ۲ ساعت</span><ArrowLeft className="h-4 w-4 text-primary" /></div>
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
        <StaggerScroll className="grid grid-cols-2 md:grid-cols-4 gap-6" stagger={0.08}>
          {stats.map((stat) => (
            <StaggerScrollItem key={stat.label}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 mb-3">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gradient-brand">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </StaggerScrollItem>
          ))}
        </StaggerScroll>
      </div>
    </section>
  );
}

function HeroSection({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <section id="top" className="relative flex min-h-[90vh] items-center px-4 py-28">
      <FloatingBlur />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center lg:text-right"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-bold text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            بهترین پلتفرم مدیریت باشگاه بانوان
          </motion.div>

          <h1 className="mb-5 text-4xl font-black leading-[1.2] tracking-tight md:text-6xl lg:text-7xl">
            <motion.span
              className="block"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              حرکت، قدرت،
            </motion.span>
            <motion.span
              className="block text-gradient-brand"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              نسخه بهتر تو
            </motion.span>
          </h1>

          <motion.p
            className="mx-auto mb-8 max-w-xl text-base leading-8 text-muted-foreground md:text-lg lg:mx-0"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            جیم‌آپ، باشگاه دیجیتال اختصاصی بانوان برای برنامه تمرینی شخصی، ارتباط مستقیم با مربی و دیدن پیشرفت واقعی در هر روز.
          </motion.p>

          <motion.div
            className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
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
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: .92, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: .35, duration: .7 }}
          className="relative mx-auto w-full max-w-[30rem]"
        >
          <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-activity-move/15 via-transparent to-activity-stand/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.4rem] bg-brand-surface p-6 text-white shadow-[0_35px_90px_-35px_rgba(53,20,52,.75)] md:p-8">
            <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-activity-stand/25 blur-[70px]" />
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
          <div className="absolute -bottom-5 -right-3 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-right shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#241b2d]/90">
             <p className="text-xs text-muted-foreground">همراه با مربی</p>
            <p className="text-xs font-black">برنامه اختصاصی تو</p>
          </div>
        </motion.div>
      </div>
      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        <ChevronDown className="h-6 w-6 text-muted-foreground/40" />
      </motion.div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

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

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <main className="relative min-h-screen overflow-hidden bg-background">
        <LandingNavigation onLogin={() => router.push("/auth/login")} onRegister={() => router.push("/auth/register")} />
        <HeroSection
          onLogin={() => router.push("/auth/login")}
          onRegister={() => router.push("/auth/register")}
        />
        <StatsSection />
        <FeaturesSection />
        <WeeklyExperienceSection />

        {/* Footer */}
        <footer className="relative py-8 px-4 border-t border-border/40">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="gradient-brand flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white">
                ج
              </div>
              <span className="font-bold">جیم‌آپ</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © ۱۴۰۴ تمامی حقوق محفوظ است | باشگاه ورزشی جیم‌آپ
            </p>
          </div>
        </footer>
      </main>
    </Suspense>
  );
}
