"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import type { User } from "@/lib/types";
import { SelectField } from "./SelectField";

const schema = z.object({
  participantId: z.string().min(1, "ورزشکار را انتخاب کنید"),
});

type FormValues = z.infer<typeof schema>;

interface NewConversationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Athletes who do not have a thread with this coach yet. */
  candidates: User[];
  loading: boolean;
  pending: boolean;
  onSubmit: (participantId: string) => void | Promise<void>;
}

/** Opens a thread with an athlete the coach has not written to before. */
export function NewConversationSheet({
  open,
  onOpenChange,
  candidates,
  loading,
  pending,
  onSubmit,
}: NewConversationSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="گفت‌وگوی تازه"
      description="ورزشکاری را انتخاب کنید که تا امروز با او گفت‌وگویی نداشته‌اید."
    >
      <NewConversationFields
        candidates={candidates}
        loading={loading}
        pending={pending}
        onCancel={() => onOpenChange(false)}
        onSubmit={onSubmit}
      />
    </Sheet>
  );
}

function NewConversationFields({
  candidates,
  loading,
  pending,
  onCancel,
  onSubmit,
}: Omit<NewConversationSheetProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { participantId: "" },
  });

  const options = React.useMemo(
    () =>
      candidates.map((athlete) => ({
        value: athlete.id,
        label: `${athlete.firstName} ${athlete.lastName}`.trim() || athlete.email,
      })),
    [candidates]
  );

  const participantId = watch("participantId");

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.participantId))} className="space-y-4" noValidate>
      <SelectField
        id="new-conversation-athlete"
        label="ورزشکار"
        required
        value={participantId}
        onValueChange={(value) =>
          setValue("participantId", value, { shouldDirty: true, shouldValidate: true })
        }
        options={options}
        placeholder="انتخاب ورزشکار"
        hint={
          loading
            ? "در حال بارگذاری فهرست ورزشکاران..."
            : options.length === 0
              ? "با همه ورزشکاران گفت‌وگو دارید."
              : undefined
        }
        error={errors.participantId?.message}
        disabled={pending || options.length === 0}
      />

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          انصراف
        </Button>
        <Button type="submit" loading={pending} disabled={options.length === 0}>
          شروع گفت‌وگو
        </Button>
      </div>
    </form>
  );
}
