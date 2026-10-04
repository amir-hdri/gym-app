"use client";

import { Button } from "@/components/ui/Button";
import { cn, parseApiDate } from "@/lib/utils";
import { Bell, Calendar, MessageSquare, CreditCard, Dumbbell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/twilight/controls";

const typeIcons: Record<string, React.ReactNode> = {
  info: <Bell className="h-5 w-5 text-[#8e98a8]" strokeWidth={1.75} />,
  success: <Dumbbell className="h-5 w-5 text-[#d2c0a5]" strokeWidth={1.75} />,
  warning: <CreditCard className="h-5 w-5 text-warning" strokeWidth={1.75} />,
  error: <MessageSquare className="h-5 w-5 text-destructive" strokeWidth={1.75} />,
  reminder: <Calendar className="h-5 w-5 text-[#d2c0a5]" strokeWidth={1.75} />,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const athleteId = user?.id;
  const { data, isLoading, isError, error } = useNotifications(athleteId);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    if (athleteId) {
      markAllRead.mutate(athleteId, {
        onSuccess: () => toast.success("همه اعلان‌ها به عنوان خوانده شده علامت خوردند"),
      });
    }
  };

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  return (
    <PageShell>
      <PageHeader
        title="اعلان‌ها"
        subtitle="پیام‌ها و یادآوری‌ها"
        action={
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <>
                <Badge variant="default" className="bg-primary/10 text-primary">{unreadCount} عدد خوانده نشده</Badge>
                <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                  <CheckCheck className="ml-2 h-4 w-4" strokeWidth={1.75} />علامت همه به عنوان خوانده شده
                </Button>
              </>
            )}
          </div>
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" strokeWidth={1.75} />}
          title="هیچ اعلانی وجود ندارد"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#232934] bg-[#161a22] divide-y divide-[#1e2430]">
          {notifications.map((n) => {
            const timeAgo = getRelativeTime(n.createdAt);
            return (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={cn(
                  "flex cursor-pointer items-start gap-4 px-4 py-3.5 transition-colors hover:bg-[#1a202a]",
                  !n.isRead && "bg-primary/5"
                )}
              >
                <div className="mt-1 shrink-0">{typeIcons[n.type] || typeIcons.info}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium text-white", !n.isRead && "text-primary")}>{n.title}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-[#8e98a8]">{timeAgo}</span>
                      {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-[#8e98a8]">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - parseApiDate(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "چند لحظه پیش";
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} روز پیش`;
  return `${Math.floor(days / 7)} هفته پیش`;
}
