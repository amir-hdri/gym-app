"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Save } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { toast } from "sonner";
import { useUsers } from "@/hooks/use-api";

const frequencies = ["۱ روز در هفته", "۲ روز در هفته", "۳ روز در هفته", "۴ روز در هفته", "۵ روز در هفته", "۶ روز در هفته", "۷ روز در هفته"];

export default function NewProgramPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [athlete, setAthlete] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: athletesData, isLoading: athletesLoading } = useUsers("athlete");
  const athletes = athletesData?.data || [];

  const handleSave = async () => {
    if (!title || !athlete || !startDate || !endDate || !frequency) {
      toast.error("لطفاً تمام فیلدها را پر کنید");
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      toast.success("برنامه با موفقیت ایجاد شد");
      router.push("/coach/programs");
    } catch {
      toast.error("خطا در ایجاد برنامه");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/coach/programs">
            <ChevronRight className="h-4 w-4" />
            بازگشت به برنامه‌ها
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">برنامه جدید</h1>
        <p className="mt-1 text-muted-foreground">ایجاد برنامه تمرینی جدید برای شاگرد</p>
      </div>

      <FadeIn>
        <Card glass className="max-w-2xl">
          <CardHeader>
            <CardTitle>اطلاعات برنامه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="عنوان برنامه"
              placeholder="مثال: برنامه حجیم‌سازی"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="space-y-1.5">
              <Label>ورزشکار</Label>
              <Select value={athlete} onValueChange={setAthlete} disabled={athletesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={athletesLoading ? "در حال بارگذاری..." : "انتخاب ورزشکار"} />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map((a) => {
                    const name = `${a.firstName} ${a.lastName}`;
                    return <SelectItem key={a.id} value={name}>{name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="تاریخ شروع"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="تاریخ پایان"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>تعداد جلسات در هفته</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} loading={isSubmitting}>
                <Save className="ml-2 h-4 w-4" />
                ذخیره برنامه
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
