"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { ChevronRight, Save } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { useCreateUser, useBranches } from "@/hooks/use-api";

const athleteSchema = z.object({
  firstName: z.string().min(1, "نام را وارد کنید"),
  lastName: z.string().min(1, "نام خانوادگی را وارد کنید"),
  email: z.string().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
  phone: z.string().min(1, "شماره موبایل را وارد کنید"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  branch: z.string().min(1, "شعبه را انتخاب کنید"),
});

type AthleteFormData = z.infer<typeof athleteSchema>;

export default function NewAthletePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createUser = useCreateUser();
  const { data: branchesData } = useBranches();
  const branches = branchesData?.data || [];

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AthleteFormData>({
    resolver: zodResolver(athleteSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", branch: "" },
  });

  const selectedBranch = watch("branch");

  const onSubmit = async (formData: AthleteFormData) => {
    setIsSubmitting(true);
    try {
      await createUser.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: "athlete",
        branchId: formData.branch,
        status: "active",
      });
      toast.success("شاگرد جدید با موفقیت ثبت شد");
      router.push("/coach/athletes");
    } catch {
      toast.error("خطا در ثبت شاگرد جدید");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/coach/athletes"><ChevronRight className="h-4 w-4" /> بازگشت به لیست شاگردان</Link>
        </Button>
        <h1 className="text-2xl font-bold">ثبت شاگرد جدید</h1>
        <p className="text-muted-foreground">ثبت اطلاعات شاگرد جدید</p>
      </div>

      <FadeIn>
        <Card glass>
          <CardHeader><CardTitle>اطلاعات شخصی</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="نام" placeholder="نگار" error={errors.firstName?.message} {...register("firstName")} />
                <Input label="نام خانوادگی" placeholder="محمدی" error={errors.lastName?.message} {...register("lastName")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="ایمیل" type="email" placeholder="ali@example.com" error={errors.email?.message} {...register("email")} />
                <Input label="شماره موبایل" type="tel" placeholder="۰۹۱۲۱۱۱۲۲۳۳" error={errors.phone?.message} {...register("phone")} />
              </div>
              <Input label="رمز عبور" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
              <div className="space-y-1.5">
                <Label>شعبه</Label>
                <Select value={selectedBranch} onValueChange={(v) => setValue("branch", v)}>
                  <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branch && <p className="text-sm text-destructive">{errors.branch.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => router.push("/coach/athletes")}>انصراف</Button>
                <Button type="submit" loading={isSubmitting}><Save className="ml-2 h-4 w-4" />ثبت شاگرد</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
