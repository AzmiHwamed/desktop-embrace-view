import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  CheckCheck,
  Headphones,
  Languages,
  Mic,
  Play,
  Plus,
  Sparkles,
  Square,
  UserRound,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSelector, useTranslations } from "@/app/hooks";
import { API_BASE_URL, apiFetch, type ApiResponse } from "@/lib/api-client";
import { isRtlLanguage } from "@/lib/rtl";
import strings from "@/locales/en/interpreter.json";
import type { Language } from "@/features/account/types";
import type { InterpreterConversation, InterpreterSpeaker, InterpreterTurn } from "./types";

const FALLBACK_LANGUAGES: Language[] = [
  { id: "fallback-ar", code: "ar", name: "Arabic" },
  { id: "fallback-en", code: "en", name: "English" },
];

export function InterpreterPage() {
  const t = useTranslations("interpreter", strings);
  const profile = useAppSelector((state) => state.account.profile);
  const isGuest = useAppSelector((state) => state.auth.isGuest);
  const isRtl = isRtlLanguage(profile?.language?.code);
  const [travelerLanguage, setTravelerLanguage] = useState("ar");
  const [localLanguage, setLocalLanguage] = useState("en");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState(true);
  const [conversation, setConversation] = useState<InterpreterConversation | null>(null);
  const [conversations, setConversations] = useState<InterpreterConversation[]>([]);
  const [recordingSpeaker, setRecordingSpeaker] = useState<InterpreterSpeaker | null>(null);
  const [processing, setProcessing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const translatedAudioRef = useRef<HTMLAudioElement | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isGuest) {
      apiFetch<ApiResponse<InterpreterConversation[]>>("/interpreter/conversations")
        .then((response) => setConversations(response.data))
        .catch(() => toast.error(t.loadFailed));
    }
    apiFetch<ApiResponse<Language[]>>("/languages")
      .then((response) => setLanguages(response.data))
      .catch(() => {
        setLanguages(FALLBACK_LANGUAGES);
        toast.error(t.languagesLoadFailed);
      })
      .finally(() => setLanguagesLoading(false));
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [isGuest, t.loadFailed]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation?.turns?.length, processing]);

  async function ensureConversation(): Promise<InterpreterConversation> {
    if (conversation) return conversation;
    if (isGuest) {
      const created: InterpreterConversation = {
        id: "guest",
        travelerLanguage,
        localLanguage,
        title: null,
        turns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversation(created);
      return created;
    }
    const response = await apiFetch<ApiResponse<InterpreterConversation>>("/interpreter/conversations", {
      method: "POST",
      body: JSON.stringify({ travelerLanguage, localLanguage }),
    });
    const created = { ...response.data, turns: [] };
    setConversation(created);
    setConversations((items) => [created, ...items]);
    return created;
  }

  async function loadConversation(id: string) {
    if (recordingSpeaker || processing) return;
    try {
      const response = await apiFetch<ApiResponse<InterpreterConversation>>(`/interpreter/conversations/${id}`);
      setConversation(response.data);
      setTravelerLanguage(response.data.travelerLanguage);
      setLocalLanguage(response.data.localLanguage);
    } catch {
      toast.error(t.loadFailed);
    }
  }

  async function startRecording(speaker: InterpreterSpeaker) {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error(t.recordingUnsupported);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || audioTrack.readyState !== "live") {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Microphone is not producing an active audio track");
      }
      const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 128_000,
      });
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        void submitRecording(speaker, blob);
      };
      recorder.start(250);
      setRecordingSpeaker(speaker);
    } catch {
      toast.error(t.microphoneDenied);
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecordingSpeaker(null);
  }

  async function submitRecording(speaker: InterpreterSpeaker, blob: Blob) {
    setProcessing(true);
    try {
      const active = await ensureConversation();
      const sourceLanguage = speaker === "traveler" ? travelerLanguage : localLanguage;
      const targetLanguage = speaker === "traveler" ? localLanguage : travelerLanguage;
      const extension = blob.type.includes("ogg") ? "ogg" : "webm";
      const form = new FormData();
      form.append("audio", blob, `recording.${extension}`);
      form.append("speaker", speaker);
      form.append("sourceLanguage", sourceLanguage);
      form.append("targetLanguage", targetLanguage);
      const response = await apiFetch<ApiResponse<InterpreterTurn>>(
        isGuest ? "/guest/interpreter/turn" : `/interpreter/conversations/${active.id}/turns`,
        { method: "POST", body: form },
      );
      setConversation((current) => current
        ? { ...current, turns: [...(current.turns ?? []), response.data] }
        : current);
      const audio = new Audio(audioUrl(response.data.translatedAudioUrl));
      translatedAudioRef.current = audio;
      await audio.play().catch(() => undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.processFailed);
    } finally {
      setProcessing(false);
    }
  }

  const languageLocked = Boolean(conversation?.turns?.length);
  const turns = conversation?.turns ?? [];

  return (
    <div className="space-y-5" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setConversation(null)}
            disabled={Boolean(recordingSpeaker) || processing}
          >
            <Plus className="h-4 w-4" />
            {t.newConversation}
          </Button>
        }
      />

      <Card className="overflow-hidden border-primary/10 shadow-card">
        <div className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-primary-foreground">
              <Languages className="h-5 w-5" />
              <span className="absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold">{t.conversationTitle}</h2>
              <p className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t.readyToInterpret}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span>{languageName(travelerLanguage, languages)}</span>
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>{languageName(localLanguage, languages)}</span>
          </div>
        </div>

        <CardContent className="border-b bg-muted/20 p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <LanguageSelect label={t.yourLanguage} value={travelerLanguage} languages={languages} onChange={setTravelerLanguage} disabled={languageLocked || languagesLoading} placeholder={languagesLoading ? t.loadingLanguages : undefined} />
            <span className="mx-auto mb-2 hidden text-muted-foreground sm:block"><ArrowLeftRight className="h-4 w-4" /></span>
            <LanguageSelect label={t.localLanguage} value={localLanguage} languages={languages} onChange={setLocalLanguage} disabled={languageLocked || languagesLoading} placeholder={languagesLoading ? t.loadingLanguages : undefined} />
          </div>
        </CardContent>

        <div className="h-[min(55vh,620px)] min-h-[360px] overflow-y-auto bg-[radial-gradient(circle_at_top,var(--color-primary)_0,transparent_42%)] bg-[length:100%_320px] bg-no-repeat px-3 py-5 sm:px-6">
          {turns.length === 0 && !processing ? (
            <div className="grid h-full place-items-center">
              <div className="max-w-sm text-center">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-card text-primary shadow-sm">
                  <Headphones className="h-6 w-6" />
                </span>
                <p className="font-semibold">{t.emptyTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.empty}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {turns.map((turn) => <MessageBubble key={turn.id} turn={turn} languages={languages} t={t} />)}
              {processing && <ProcessingBubble label={t.processing} />}
              <div ref={conversationEndRef} />
            </div>
          )}
        </div>

        <div className="border-t bg-card p-3 sm:p-4">
          <p className="mb-3 text-center text-xs font-medium text-muted-foreground">{t.chooseSpeaker}</p>
          <div className="grid grid-cols-2 gap-3">
            <MicrophoneAction
              speaker="traveler"
              label={t.traveler}
              language={travelerLanguage}
              languages={languages}
              active={recordingSpeaker === "traveler"}
              disabled={Boolean(recordingSpeaker && recordingSpeaker !== "traveler") || processing || languagesLoading}
              onStart={startRecording}
              onStop={stopRecording}
              recordingLabel={t.recording}
              startLabel={t.tapToSpeak}
              stopLabel={t.stopRecording}
              own
            />
            <MicrophoneAction
              speaker="local"
              label={t.local}
              language={localLanguage}
              languages={languages}
              active={recordingSpeaker === "local"}
              disabled={Boolean(recordingSpeaker && recordingSpeaker !== "local") || processing || languagesLoading}
              onStart={startRecording}
              onStop={stopRecording}
              recordingLabel={t.recording}
              startLabel={t.tapToSpeak}
              stopLabel={t.stopRecording}
            />
          </div>
        </div>
      </Card>

      {conversations.length > 0 && (
        <section className="space-y-3 border-t pt-5">
          <div>
            <h2 className="font-semibold">{t.previousConversations}</h2>
            <p className="text-sm text-muted-foreground">{t.previousConversationsHint}</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {conversations.map((item) => (
              <Button
                key={item.id}
                variant={item.id === conversation?.id ? "default" : "outline"}
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => loadConversation(item.id)}
              >
                {new Date(item.createdAt).toLocaleString()}
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LanguageSelect({ label, value, languages, onChange, disabled, placeholder }: {
  label: string;
  value: string;
  languages: Language[];
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
      <span>{label}</span>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-10 rounded-xl bg-background text-foreground"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.id} value={language.code}>{language.name} ({language.code})</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function MicrophoneAction(props: {
  speaker: InterpreterSpeaker;
  label: string;
  language: string;
  languages: Language[];
  active: boolean;
  disabled: boolean;
  onStart: (speaker: InterpreterSpeaker) => void;
  onStop: () => void;
  recordingLabel: string;
  startLabel: string;
  stopLabel: string;
  own?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={props.active ? "destructive" : props.own ? "default" : "secondary"}
      className="relative h-auto min-h-16 justify-start gap-3 rounded-2xl px-3 py-3 text-start sm:px-4"
      disabled={props.disabled}
      onClick={() => props.active ? props.onStop() : props.onStart(props.speaker)}
      aria-label={props.active ? props.stopLabel : `${props.startLabel}: ${props.label}`}
    >
      {props.active && <span className="absolute inset-0 animate-pulse rounded-2xl bg-white/10" />}
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background/20">
        {props.active ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
      </span>
      <span className="relative min-w-0">
        <span className="block truncate text-sm font-bold">{props.label}</span>
        <span className="block truncate text-xs font-normal opacity-80">
          {props.active ? `${props.recordingLabel}…` : languageName(props.language, props.languages)}
        </span>
      </span>
    </Button>
  );
}

function MessageBubble({ turn, languages, t }: { turn: InterpreterTurn; languages: Language[]; t: typeof strings }) {
  const own = turn.speaker === "traveler";
  return (
    <div className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
      {!own && <BubbleAvatar label={t.local} />}
      <div className={`max-w-[86%] sm:max-w-[72%] ${own ? "items-end" : "items-start"} flex flex-col`}>
        <span className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
          {own ? t.traveler : t.local} · {languageName(turn.sourceLanguage, languages)}
        </span>
        <div className={`overflow-hidden rounded-3xl shadow-sm ${
          own
            ? "rounded-ee-md bg-primary text-primary-foreground"
            : "rounded-es-md border bg-card text-card-foreground"
        }`}>
          <div className="px-4 py-3">
            <p className="text-sm leading-relaxed" dir="auto">{turn.sourceText}</p>
            <AudioButton label={t.playOriginal} url={turn.sourceAudioUrl} inverted={own} />
          </div>
          <div className={`border-t px-4 py-3 ${own ? "border-white/15 bg-black/10" : "bg-muted/60"}`}>
            <p className={`mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${own ? "text-white/70" : "text-primary"}`}>
              <Sparkles className="h-3 w-3" />
              {t.translation} · {languageName(turn.targetLanguage, languages)}
            </p>
            <p className="text-sm font-semibold leading-relaxed" dir="auto">{turn.translatedText}</p>
            <AudioButton label={t.playTranslation} url={turn.translatedAudioUrl} inverted={own} />
          </div>
        </div>
        <span className="mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
          {formatMessageTime(turn.createdAt)}
          {own && <CheckCheck className="h-3 w-3 text-primary" />}
        </span>
      </div>
      {own && <BubbleAvatar label={t.traveler} own />}
    </div>
  );
}

function BubbleAvatar({ label, own = false }: { label: string; own?: boolean }) {
  return (
    <span
      title={label}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
        own ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}
    >
      <UserRound className="h-4 w-4" />
    </span>
  );
}

function ProcessingBubble({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-2">
      <BubbleAvatar label={label} />
      <div className="rounded-3xl rounded-es-md border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5" aria-label={label} role="status">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
              style={{ animationDelay: `${index * 140}ms` }}
            />
          ))}
          <Sparkles className="ms-1 h-3.5 w-3.5 text-primary" />
        </div>
      </div>
    </div>
  );
}

function AudioButton({ label, url, inverted = false }: { label: string; url: string; inverted?: boolean }) {
  return (
    <button
      type="button"
      className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${
        inverted ? "text-white/80 hover:text-white" : "text-primary hover:text-primary/80"
      }`}
      onClick={() => void new Audio(audioUrl(url)).play()}
    >
      <span className={`grid h-6 w-6 place-items-center rounded-full ${inverted ? "bg-white/15" : "bg-primary/10"}`}>
        <Play className="h-3 w-3 fill-current" />
      </span>
      <Volume2 className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function audioUrl(path: string) {
  return path.startsWith("http") || path.startsWith("data:") ? path : `${API_BASE_URL}${path}`;
}

function languageName(code: string, languages: Language[]) {
  return languages.find((language) => language.code === code)?.name ?? code;
}
