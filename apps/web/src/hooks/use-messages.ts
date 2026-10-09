/**
 * Messaging hooks (API contract v2 §1).
 *
 * Re-exported from `use-api.ts`, so UI code can import either module.
 *
 * The caller's id: the real API takes it from the bearer token, but the mock
 * service and the optimistic cache writes need it locally, so it is read from
 * `localStorage` via `currentUserId()` rather than from `useAuth()` — keeping
 * the data layer free of a dependency on the component tree (and usable in
 * tests with no provider mounted).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ChatMessage, Conversation, PaginatedResponse } from "@/lib/types";
import {
  Q, USE_MOCK, mockService, currentUserId, requireUserId,
  snapshotQueries, restoreQueries, patchListQueries, patchItemQueries,
} from "./api-source";

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: Q.conversations(userId),
    queryFn: () => USE_MOCK ? mockService.getConversations(userId || requireUserId()) : api.getConversations(),
    enabled: !!userId || !USE_MOCK,
  });
}

export function useConversation(id?: string, userId?: string) {
  return useQuery({
    queryKey: Q.conversation(id || ""),
    queryFn: () => USE_MOCK
      ? mockService.getConversation(userId || requireUserId(), id || "")
      : api.getConversation(id || ""),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, userId }: { participantId: string; userId?: string }) =>
      USE_MOCK
        ? mockService.createConversation(userId || requireUserId(), participantId)
        : api.createConversation({ participantId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["conversations"] }); },
  });
}

export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: Q.messages(conversationId || ""),
    queryFn: () => USE_MOCK ? mockService.getMessages(conversationId || "") : api.getMessages(conversationId || ""),
    enabled: !!conversationId,
  });
}

export function useUnreadMessageCount(userId?: string) {
  return useQuery({
    queryKey: Q.unreadMessages(userId),
    queryFn: () => USE_MOCK ? mockService.getUnreadMessageCount(userId || requireUserId()) : api.getUnreadMessageCount(),
    enabled: !!userId || !USE_MOCK,
  });
}

/**
 * Sends a message, appending it to the open thread immediately.
 *
 * The placeholder carries a `temp-` id; `onSettled` refetches, so the real id
 * replaces it a moment later. On failure the thread (and the conversation-list
 * preview, which is patched in step with it) is restored exactly as it was.
 */
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, body, senderId }: { conversationId: string; body: string; senderId?: string }) =>
      USE_MOCK
        ? mockService.sendMessage(conversationId, body, senderId || requireUserId())
        : api.sendMessage(conversationId, { body }),

    onMutate: async ({ conversationId, body, senderId }) => {
      const sender = senderId || currentUserId() || "";
      await Promise.all([
        qc.cancelQueries({ queryKey: Q.messages(conversationId) }),
        qc.cancelQueries({ queryKey: ["conversations"] }),
      ]);
      const snapshot = [
        ...snapshotQueries(qc, Q.messages(conversationId)),
        ...snapshotQueries(qc, ["conversations"]),
      ];

      const pending: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversationId,
        senderId: sender,
        body: body.trim(),
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      // Messages are ordered ascending, so the new one goes last.
      patchListQueries<ChatMessage>(qc, Q.messages(conversationId), (items) => [...items, pending]);
      patchListQueries<Conversation>(qc, ["conversations"], (items) =>
        items.map((c) => c.id === conversationId
          ? {
              ...c,
              lastMessage: { id: pending.id, body: pending.body, senderId: sender, createdAt: pending.createdAt },
              lastMessageAt: pending.createdAt,
            }
          : c));

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => { restoreQueries(qc, ctx?.snapshot); },
    onSettled: (_data, _err, { conversationId }) => {
      qc.invalidateQueries({ queryKey: Q.messages(conversationId) });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messages-unread"] });
    },
  });
}

/**
 * Marks a thread read, clearing its badge and decrementing the global unread
 * count straight away — the one number a user watches while they read.
 */
export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId?: string }) =>
      USE_MOCK
        ? mockService.markConversationRead(conversationId, userId || requireUserId())
        : api.markConversationRead(conversationId),

    onMutate: async ({ conversationId, userId }) => {
      const viewerId = userId || currentUserId();
      await Promise.all([
        qc.cancelQueries({ queryKey: Q.messages(conversationId) }),
        qc.cancelQueries({ queryKey: ["conversations"] }),
        qc.cancelQueries({ queryKey: Q.conversation(conversationId) }),
        qc.cancelQueries({ queryKey: ["messages-unread"] }),
      ]);
      const snapshot = [
        ...snapshotQueries(qc, Q.messages(conversationId)),
        ...snapshotQueries(qc, ["conversations"]),
        ...snapshotQueries(qc, Q.conversation(conversationId)),
        ...snapshotQueries(qc, ["messages-unread"]),
      ];

      // How many this clears, read before the patch zeroes it.
      const cleared = qc.getQueriesData<PaginatedResponse<Conversation>>({ queryKey: ["conversations"] })
        .flatMap(([, page]) => page?.data ?? [])
        .find((c) => c.id === conversationId)?.unreadCount ?? 0;

      const readAt = new Date().toISOString();
      // Only the other party's messages get a receipt; without a known viewer
      // we would stamp the user's own messages, so skip that part instead.
      if (viewerId) {
        patchListQueries<ChatMessage>(qc, Q.messages(conversationId), (items) =>
          items.map((m) => (m.senderId !== viewerId && !m.readAt ? { ...m, readAt } : m)));
      }
      patchListQueries<Conversation>(qc, ["conversations"], (items) =>
        items.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
      patchItemQueries<Conversation>(qc, Q.conversation(conversationId), (c) => ({ ...c, unreadCount: 0 }));
      if (cleared > 0) {
        patchItemQueries<{ count: number }>(qc, ["messages-unread"], (d) => ({
          ...d,
          count: Math.max(0, d.count - cleared),
        }));
      }

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => { restoreQueries(qc, ctx?.snapshot); },
    onSettled: (_data, _err, { conversationId }) => {
      qc.invalidateQueries({ queryKey: Q.messages(conversationId) });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: Q.conversation(conversationId) });
      qc.invalidateQueries({ queryKey: ["messages-unread"] });
    },
  });
}
