"use client";

import { useState, useEffect } from "react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Bell, Calendar, MessageSquare, CreditCard, Dumbbell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";

const typeIcons: Record<string, React.ReactNode> = {
  info: <Bell className="h-5 w-5 text-primary" />,
  success: <Dumbbell className="h-5 w-5 text-primary" />,
  warning: <CreditCard className="h-5 w-5 text-green-500" />,
  error: <MessageSquare className="h-5 w-5 text-blue-500" />,
  reminder: <Calendar className="h-5 w-5 text-amber-500" />,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">اعلان‌ها</h1>
          <p className="mt-1 text-muted-foreground">پیام‌ها و یادآوری‌ها</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <>
              <Badge variant="default" className="bg-primary/10 text-primary">{unreadCount} عدد خوانده نشده</Badge>
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="ml-2 h-4 w-4" />علامت همه به عنوان خوانده شده
              </Button>
            </>
          )}
        </div>
      </div>

      <FadeIn>
        <Card glass>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-12 w-12 text-muted-foreground" />}
                title="هیچ اعلانی وجود ندارد"
              />
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((n) => {
                  const timeAgo = getRelativeTime(n.createdAt);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleMarkRead(n.id)}
                      className={cn(
                        "flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-white/20",
                        !n.isRead && "bg-primary/5"
                      )}
                    >
                      <div className="mt-1 shrink-0">{typeIcons[n.type] || typeIcons.info}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("font-medium", !n.isRead && "text-primary")}>{n.title}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{timeAgo}</span>
                            {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          </div>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "چند لحظه پیش";
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} روز پیش`;
  return `${Math.floor(days / 7)} هفته پیش`;
}
