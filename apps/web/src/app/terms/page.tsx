import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:py-16">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/auth/register"><ArrowRight className="h-4 w-4" />بازگشت به ثبت‌نام</Link>
      </Button>
      <Card>
        <CardContent className="space-y-7 p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></div>
            <div><h1 className="text-2xl font-black sm:text-3xl">قوانین و مقررات جیم‌آپ</h1><p className="mt-1 text-sm text-muted-foreground">آخرین به‌روزرسانی: تیر ۱۴۰۵</p></div>
          </div>
          <section><h2 className="text-lg font-bold">استفاده از خدمات</h2><p className="mt-2 leading-8 text-muted-foreground">با ایجاد حساب، متعهد می‌شوید اطلاعات صحیح ارائه دهید، از حساب خود محافظت کنید و از خدمات مطابق قوانین باشگاه استفاده کنید.</p></section>
          <section><h2 className="text-lg font-bold">سلامت و مسئولیت فردی</h2><p className="mt-2 leading-8 text-muted-foreground">برنامه‌های تمرینی جایگزین تشخیص پزشکی نیستند. پیش از شروع تمرین و در صورت وجود محدودیت جسمانی با پزشک یا مربی خود مشورت کنید.</p></section>
          <section><h2 className="text-lg font-bold">حریم خصوصی</h2><p className="mt-2 leading-8 text-muted-foreground">اطلاعات پروفایل و فعالیت شما فقط برای ارائه خدمات، شخصی‌سازی برنامه و ارتباط با مربی استفاده می‌شود و بدون مبنای قانونی در اختیار اشخاص ثالث قرار نمی‌گیرد.</p></section>
          <section><h2 className="text-lg font-bold">عضویت و پرداخت</h2><p className="mt-2 leading-8 text-muted-foreground">شرایط اعتبار، تمدید و لغو هر عضویت پیش از پرداخت نمایش داده می‌شود. ثبت پرداخت به معنی پذیرش شرایط همان طرح است.</p></section>
        </CardContent>
      </Card>
    </main>
  );
}
