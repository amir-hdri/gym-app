"use client";

import { useState } from "react";
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPersianNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Search, Plus, Copy, Clock, Dumbbell, Users } from "lucide-react";

const templates = [
  { id: 1, name: "حجم‌سازی ۳ روزه", days: 3, exercises: 12, intensity: "متوسط", usage: 8, category: "حجمی" },
  { id: 2, name: "قدرتی ۴ روزه", days: 4, exercises: 16, intensity: "بالا", usage: 12, category: "قدرتی" },
  { id: 3, name: "کاهش وزن ۵ روزه", days: 5, exercises: 20, intensity: "متوسط", usage: 6, category: "هوازی" },
  { id: 4, name: "فول بادی ۳ روزه", days: 3, exercises: 9, intensity: "بالا", usage: 15, category: "ترکیبی" },
  { id: 5, name: "فانکشنال ۴ روزه", days: 4, exercises: 14, intensity: "متوسط", usage: 4, category: "فانکشنال" },
  { id: 6, name: "مبتدی ۳ روزه", days: 3, exercises: 9, intensity: "پایین", usage: 20, category: "مبتدی" },
];

const categoryColors: Record<string, string> = {
  حجمی: "border-blue-300 dark:border-blue-700",
  قدرتی: "border-red-300 dark:border-red-700",
  هوازی: "border-green-300 dark:border-green-700",
  ترکیبی: "border-purple-300 dark:border-purple-700",
  فانکشنال: "border-orange-300 dark:border-orange-700",
  مبتدی: "border-gray-300 dark:border-gray-600",
};

const intensityColor: Record<string, "success" | "warning" | "destructive"> = {
  پایین: "success", متوسط: "warning", بالا: "destructive",
};

export default function TemplatesPage() {
  const [search, setSearch] = useState("");

  const filtered = templates.filter((t) => t.name.includes(search) || t.category.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-8">الگوهای برنامه</h1>
          <p className="mt-1 text-muted-foreground leading-6">الگوهای آماده قابل استفاده مجدد</p>
        </div>
        <Button onClick={() => toast.info("قابلیت ساخت الگو به زودی اضافه می‌شود")} className="w-full sm:w-auto"><Plus className="ml-2 h-4 w-4" />الگوی جدید</Button>
      </div>

      <Card glass>
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="جستجوی الگو..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 bg-white/70 backdrop-blur-sm border-white/30" />
          </div>
        </CardContent>
      </Card>

      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <StaggerItem key={template.id}>
            <Card glass hover className={`border-t-4 cursor-pointer ${categoryColors[template.category] || "border-white/20"}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <CardTitle className="min-w-0 flex-1 text-lg leading-snug break-words">{template.name}</CardTitle>
                    <Badge variant={intensityColor[template.intensity]} className="shrink-0">{template.intensity}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatPersianNumber(template.days)} روز در هفته</span>
                  <span className="flex items-center gap-1"><Dumbbell className="h-4 w-4" />{formatPersianNumber(template.exercises)} تمرین</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{formatPersianNumber(template.usage)} بار استفاده</span>
                </div>
                <Badge variant="outline" className="bg-white/40">{template.category}</Badge>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Button variant="outline" size="sm" className="w-full sm:flex-1 sm:w-auto whitespace-normal leading-5" onClick={() => toast.info("برای استفاده از این الگو، به صفحه برنامه‌ها بروید")}><Copy className="h-4 w-4" />استفاده برای شاگرد</Button>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => toast.info("مشاهده جزئیات الگو")}>مشاهده</Button>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
