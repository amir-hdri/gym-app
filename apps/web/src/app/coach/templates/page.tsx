"use client";

import { useState } from "react";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { TwilightCard, SearchInput, CtaButton, EmptyState } from "@/components/twilight/controls";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPersianNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Copy, Clock, Dumbbell, Users, LayoutTemplate } from "lucide-react";

const templates = [
  { id: 1, name: "حجم‌سازی ۳ روزه", days: 3, exercises: 12, intensity: "متوسط", usage: 8, category: "حجمی" },
  { id: 2, name: "قدرتی ۴ روزه", days: 4, exercises: 16, intensity: "بالا", usage: 12, category: "قدرتی" },
  { id: 3, name: "کاهش وزن ۵ روزه", days: 5, exercises: 20, intensity: "متوسط", usage: 6, category: "هوازی" },
  { id: 4, name: "فول بادی ۳ روزه", days: 3, exercises: 9, intensity: "بالا", usage: 15, category: "ترکیبی" },
  { id: 5, name: "فانکشنال ۴ روزه", days: 4, exercises: 14, intensity: "متوسط", usage: 4, category: "فانکشنال" },
  { id: 6, name: "مبتدی ۳ روزه", days: 3, exercises: 9, intensity: "پایین", usage: 20, category: "مبتدی" },
];

const intensityColor: Record<string, "success" | "warning" | "destructive"> = {
  پایین: "success", متوسط: "warning", بالا: "destructive",
};

export default function TemplatesPage() {
  const [search, setSearch] = useState("");

  const filtered = templates.filter((t) => t.name.includes(search) || t.category.includes(search));

  return (
    <PageShell>
      <PageHeader
        title="الگوهای برنامه"
        subtitle="الگوهای آماده قابل استفاده مجدد"
        action={
          <CtaButton onClick={() => toast.info("قابلیت ساخت الگو به زودی اضافه می‌شود")} className="w-auto px-5">
            <Plus className="ml-2 h-4 w-4" strokeWidth={1.75} />
            الگوی جدید
          </CtaButton>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="جستجوی الگو..." className="max-w-md" />

      {filtered.length === 0 ? (
        <EmptyState
          tone="blush"
          icon={<LayoutTemplate className="h-6 w-6" strokeWidth={1.75} />}
          title="الگویی یافت نشد"
          description="الگویی با عبارت جست‌وجوی شما وجود ندارد"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <TwilightCard key={template.id} hover className="flex cursor-pointer flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 flex-1 break-words font-serif text-lg font-normal leading-snug text-foreground">{template.name}</h3>
                <Badge variant={intensityColor[template.intensity]} className="shrink-0">{template.intensity}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="tabular-nums">{formatPersianNumber(template.days)}</span> روز در هفته
                </span>
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="tabular-nums">{formatPersianNumber(template.exercises)}</span> تمرین
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="tabular-nums">{formatPersianNumber(template.usage)}</span> بار استفاده
                </span>
              </div>
              <Badge variant="outline">{template.category}</Badge>
              <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
                <Button variant="ghost" size="sm" className="w-full whitespace-normal leading-5 sm:w-auto sm:flex-1" onClick={() => toast.info("برای استفاده از این الگو، به صفحه برنامه‌ها بروید")}>
                  <Copy className="h-4 w-4" />
                  استفاده برای شاگرد
                </Button>
                <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => toast.info("مشاهده جزئیات الگو")}>
                  مشاهده
                </Button>
              </div>
            </TwilightCard>
          ))}
        </div>
      )}
    </PageShell>
  );
}
