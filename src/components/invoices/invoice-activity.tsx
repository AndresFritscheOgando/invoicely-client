"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, History, Send } from "lucide-react";
import api from "@/lib/api";
import type { AuditLog, InvoiceComment } from "@/types";
import { Button } from "@/components/ui/button";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAction(action: string) {
  return action.replace(/([A-Z])/g, " $1").trim();
}

export function InvoiceActivity({ invoiceId }: { invoiceId: string }) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const commentsQuery = useQuery({
    queryKey: ["invoices", invoiceId, "comments"],
    queryFn: () => api.get<InvoiceComment[]>(`/invoices/${invoiceId}/comments`).then((r) => r.data),
  });

  const auditLogsQuery = useQuery({
    queryKey: ["invoices", invoiceId, "audit-logs"],
    queryFn: () => api.get<AuditLog[]>(`/invoices/${invoiceId}/audit-logs`).then((r) => r.data),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => api.post<InvoiceComment>(`/invoices/${invoiceId}/comments`, { content }).then((r) => r.data),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["invoices", invoiceId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", invoiceId, "audit-logs"] });
    },
  });

  const combinedError = commentsQuery.error ?? auditLogsQuery.error ?? addCommentMutation.error;
  const isLoading = commentsQuery.isLoading || auditLogsQuery.isLoading;

  const auditLogs = useMemo(() => auditLogsQuery.data ?? [], [auditLogsQuery.data]);
  const comments = useMemo(() => commentsQuery.data ?? [], [commentsQuery.data]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-800">Comments</h2>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add context, clarification, or follow-up notes..."
            rows={3}
            className="w-full resize-none bg-transparent text-sm text-gray-800 outline-none"
          />
          <div className="mt-3 flex justify-end">
            <Button
              onClick={() => addCommentMutation.mutate(comment)}
              disabled={!comment.trim() || addCommentMutation.isPending}
            >
              <Send className="mr-1.5 h-4 w-4" />
              {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>

        {combinedError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Failed to load invoice activity.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded bg-gray-100" />
            <div className="h-16 animate-pulse rounded bg-gray-100" />
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
            No comments yet.
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((entry) => (
              <article key={entry.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{entry.user.name}</p>
                    <p className="text-xs text-gray-500">{entry.user.role}</p>
                  </div>
                  <time className="text-xs text-gray-400">{formatDateTime(entry.createdAt)}</time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{entry.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-gray-800">Audit History</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded bg-gray-100" />
            <div className="h-12 animate-pulse rounded bg-gray-100" />
            <div className="h-12 animate-pulse rounded bg-gray-100" />
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
            No audit entries yet.
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((entry) => (
              <article key={entry.id} className="border-l-2 border-emerald-200 pl-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatAction(entry.action)}</p>
                    <p className="text-xs text-gray-500">
                      {entry.user.name} · {entry.user.role}
                    </p>
                  </div>
                  <time className="text-xs text-gray-400">{formatDateTime(entry.createdAt)}</time>
                </div>
                {entry.newValue && (
                  <p className="mt-2 text-sm text-gray-700">{entry.newValue}</p>
                )}
                {!entry.newValue && entry.oldValue && (
                  <p className="mt-2 text-sm text-gray-700">{entry.oldValue}</p>
                )}
                {entry.oldValue && entry.newValue && (
                  <p className="mt-1 text-xs text-gray-500">
                    From: {entry.oldValue}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
