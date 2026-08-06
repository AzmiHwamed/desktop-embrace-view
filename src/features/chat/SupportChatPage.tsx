// pages/SupportChatPage.tsx
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { onValue, ref, off } from "firebase/database";

import { PageHeader } from "@/components/AppLayout";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector, useTranslations } from "@/app/hooks";
import { isRtlLanguage } from "@/lib/rtl";
import chatStrings from "@/locales/en/chat.json";
import {
  fetchMyConversation,
  fetchMessages,
  sendMessage,
  markConversationRead,
  realtimeMessageReceived,
  realtimeConnectionChanged,
} from "./chatSlice";
import { firebaseDb } from "@/lib/firebase";
import { ensureFirebaseSession } from "@/lib/firebase-session";
import type { Message } from "./types";

export function SupportChatPage({ onBack }: { onBack?: () => void }) {
  const dispatch = useAppDispatch();
  const t = useTranslations("chat", chatStrings);
  const { conversation, messages, loading, sending, realtimeConnected, error, conversationLoaded } =
    useAppSelector((s) => s.chat);
  const profile = useAppSelector((s) => s.account.profile);

  const isRtl = isRtlLanguage(profile?.language?.code);

  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load (or create) the conversation on mount.
  useEffect(() => {
    dispatch(fetchMyConversation());
  }, [dispatch]);

  // 2. Once we have a conversation: load history, mark read, and open the
  //    Firebase Realtime Database listener for live delivery.
  useEffect(() => {
    if (!conversation) return;

    dispatch(fetchMessages(conversation.id));
    dispatch(markConversationRead(conversation.id));

    let cancelled = false;
    const messagesRef = ref(firebaseDb, `chats/messages/${conversation.id}`);

    ensureFirebaseSession()
      .then(() => {
        if (cancelled) return;
        dispatch(realtimeConnectionChanged(true));

        onValue(messagesRef, (snapshot) => {
          const value = snapshot.val();
          if (!value) return;
          Object.entries(value as Record<string, Omit<Message, "id" | "conversationId">>).forEach(
            ([id, data]) => {
              dispatch(
                realtimeMessageReceived({
                  id,
                  conversationId: conversation.id,
                  ...data,
                  createdAt: new Date(data.createdAt as unknown as number).toISOString(),
                }),
              );
            },
          );
        });
      })
      .catch(() => {
        // RTDB is best-effort for live delivery — REST history above already
        // loaded, so the conversation still works, just without live push.
        dispatch(realtimeConnectionChanged(false));
      });

    return () => {
      cancelled = true;
      off(messagesRef);
      dispatch(realtimeConnectionChanged(false));
    };
  }, [conversation, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    const body = draft.trim();
    if (!body || !conversation) return;
    setDraft("");
    dispatch(sendMessage({ conversationId: conversation.id, body }));
  }

  // True until the initial conversation fetch has settled (fulfilled OR
  // rejected) — mirrors isPageLoading elsewhere. Message history and the
  // realtime listener both depend on `conversation` existing, so this is
  // the right single gate for the whole page shell.
  const isPageLoading = !conversationLoaded;

  if (isPageLoading) {
    return <SupportChatSkeleton dir={isRtl ? "rtl" : "ltr"} onBack={onBack} />;
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBack}>
            {/* Directional: "back" points to the reading start, which is
                the opposite physical side in RTL. Same treatment as the
                convert-link and swap icons elsewhere. */}
            <ArrowLeft className={"h-4 w-4" + (isRtl ? " scale-x-[-1]" : "")} />
          </Button>
        )}
        <PageHeader title={t.title} subtitle={t.subtitle} />
      </div>

      <div className="surface-card flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-semibold">{t.support}</p>
          <span
            className={
              "rounded-full px-2 py-0.5 text-[11px] font-semibold " +
              (realtimeConnected
                ? "bg-emerald-50 text-emerald-700"
                : "bg-muted text-muted-foreground")
            }
          >
            {realtimeConnected ? t.live : t.connecting}
          </span>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {loading && <InlineLoading label={t.loadingConversation} className="p-4" />}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && messages.length === 0 && (
            <p className="my-auto text-center text-sm text-muted-foreground">
              {t.noMessagesYet}
            </p>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              // justify-end/justify-start already flip correctly under
              // dir="rtl" (flexbox interprets "end" as the reading end),
              // so the own-message-on-the-end convention is preserved
              // without any isRtl branching here.
              className={`flex ${m.senderRole === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  "max-w-[70%] rounded-2xl px-4 py-2 text-sm " +
                  (m.senderRole === "user"
                    ? // Bubble "tail" corner: rounded-br-sm is a physical
                      // corner and would stay glued to the bottom-right even
                      // when the bubble visually moves to the left in RTL.
                      // rounded-ee-sm is the logical "end-end" corner (bottom
                      // of the inline-end side), so the tail follows the
                      // bubble to whichever side it actually renders on.
                      "rounded-ee-sm bg-brand text-primary-foreground"
                    : "rounded-es-sm bg-muted text-foreground")
                }
              >
                <p>{m.body}</p>
                <time className="mt-1 block text-[10px] opacity-70">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 border-t border-border p-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t.typeMessage}
            disabled={!conversation || sending}
            className="h-11 rounded-xl"
          />
          <Button
            onClick={handleSend}
            disabled={!conversation || sending || draft.trim().length === 0}
            className="rounded-xl"
          >
            {/* Send's glyph is a diagonal paper-plane pointing "forward" —
                directional in the same sense as ArrowLeft/ArrowLeftRight,
                so it mirrors with the rest of the send-direction cues. */}
            <Send className={"h-4 w-4" + (isRtl ? " scale-x-[-1]" : "")} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SupportChatSkeleton({ dir, onBack }: { dir: "rtl" | "ltr"; onBack?: () => void }) {
  return (
    <div
      className="flex h-[calc(100vh-6rem)] flex-col space-y-4"
      aria-busy="true"
      aria-label="Loading conversation"
      dir={dir}
    >
      <div className="flex items-center gap-3">
        {onBack && <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-muted" />}
        <div className="space-y-2">
          <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      <div className="surface-card flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="h-4 w-16 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="flex justify-start">
            <div className="h-10 w-2/5 animate-pulse rounded-2xl rounded-es-sm bg-muted" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-1/3 animate-pulse rounded-2xl rounded-ee-sm bg-muted" />
          </div>
          <div className="flex justify-start">
            <div className="h-10 w-1/2 animate-pulse rounded-2xl rounded-es-sm bg-muted" />
          </div>
        </div>

        <div className="flex gap-2 border-t border-border p-3">
          <div className="h-11 flex-1 animate-pulse rounded-xl bg-muted" />
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
