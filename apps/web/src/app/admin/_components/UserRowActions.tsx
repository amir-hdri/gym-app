"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { KeyRound, MoreHorizontal, Pencil, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { apiErrorMessage } from "@/components/auth/auth-helpers";
import { useDeleteUser, useUpdateUserStatus } from "@/hooks/use-api";
import type { User, UserStatus } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { UserEditSheet, UserPasswordSheet } from "./UserAdminSheets";
import { otherStatuses } from "./user-admin";

const MENU_ITEM = "min-h-11 gap-2 px-3";

export interface UserRowActionsProps {
  user: User;
  /** Where "مشاهده پروفایل" goes. Omit on the detail page itself. */
  detailHref?: string;
  /** Called after the account is deleted — the detail page navigates away. */
  onDeleted?: () => void;
  /** Noun used in the confirmation copy, e.g. "عضو" or "مربی". */
  noun: string;
}

/**
 * The full set of admin actions for one account: view, edit, reset password,
 * status transitions and delete.
 *
 * Shared by the member and coach lists and their detail pages, so the same
 * account can never be editable in one place and not the other. The status
 * transitions go through `useUpdateUserStatus` rather than `useUpdateUser`:
 * only that route validates the value server-side.
 */
export function UserRowActions({ user, detailHref, onDeleted, noun }: UserRowActionsProps) {
  const [editing, setEditing] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  const name = `${user.firstName} ${user.lastName}`.trim() || user.email;

  const changeStatus = (status: UserStatus, label: string) => {
    updateStatus.mutate(
      { id: user.id, status },
      {
        onSuccess: () => toast.success(`وضعیت ${name} به «${label}» تغییر کرد`),
        onError: (error) => toast.error(apiErrorMessage(error, "تغییر وضعیت ناموفق بود")),
      }
    );
  };

  const confirmDelete = () => {
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success(`${name} حذف شد`);
        setConfirmingDelete(false);
        onDeleted?.();
      },
      onError: (error) => toast.error(apiErrorMessage(error, "حذف حساب ناموفق بود")),
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`عملیات ${name}`}>
            <MoreHorizontal aria-hidden className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {detailHref && (
            <DropdownMenuItem asChild className={MENU_ITEM}>
              <Link href={detailHref}>
                <UserRound aria-hidden className="h-4 w-4" />
                مشاهده پروفایل
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className={MENU_ITEM} onSelect={() => setEditing(true)}>
            <Pencil aria-hidden className="h-4 w-4" />
            ویرایش اطلاعات
          </DropdownMenuItem>
          <DropdownMenuItem className={MENU_ITEM} onSelect={() => setSettingPassword(true)}>
            <KeyRound aria-hidden className="h-4 w-4" />
            تعیین رمز عبور
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            تغییر وضعیت
          </DropdownMenuLabel>
          {otherStatuses(user.status).map((option) => (
            <DropdownMenuItem
              key={option.value}
              className={MENU_ITEM}
              disabled={updateStatus.isPending}
              onSelect={() => changeStatus(option.value, option.label)}
            >
              <ShieldCheck aria-hidden className="h-4 w-4" />
              {option.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={`${MENU_ITEM} text-destructive focus:text-destructive`}
            onSelect={() => setConfirmingDelete(true)}
          >
            <Trash2 aria-hidden className="h-4 w-4" />
            حذف {noun}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserEditSheet open={editing} onOpenChange={setEditing} user={user} />
      <UserPasswordSheet open={settingPassword} onOpenChange={setSettingPassword} user={user} />
      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`حذف ${noun}`}
        description={`حساب ${name} و دسترسی او به باشگاه حذف می‌شود. این کار بازگشتی ندارد.`}
        confirmLabel="حذف حساب"
        onConfirm={confirmDelete}
        loading={deleteUser.isPending}
      />
    </>
  );
}
