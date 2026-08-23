import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, ExternalLink, MapPin, Star, Volume2, X } from "lucide-react";
import { apiFetch, type ApiResponse } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Detail = {
  id: string;
  name: string;
  address: string;
  narration: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  editorialSummary?: { text?: string };
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  photos: Array<{
    photoUri: string | null;
    photoAttributions: Array<{ displayName?: string; uri?: string }>;
  }>;
};

export function PlaceDetailsPage({ placeId }: { placeId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");
  const [spokenText, setSpokenText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [descriptionLoading, setDescriptionLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ApiResponse<Detail>>(
      `/guest/explore/place/${encodeURIComponent(placeId)}?languageCode=en`,
    )
      .then(async (response) => {
        setDetail(response.data);
        try {
          const generated = await apiFetch<ApiResponse<{ description: string }>>(
            `/guest/explore/place/${encodeURIComponent(placeId)}/description`,
            {
              method: "POST",
              body: JSON.stringify({ languageCode: "en" }),
            },
          );
          setDescription(generated.data.description);
        } catch {
          setDescription(response.data.editorialSummary?.text ?? response.data.narration);
        } finally {
          setDescriptionLoading(false);
        }
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Unable to load this place"),
      );
  }, [placeId]);

  async function playDescription() {
    setSpeaking(true);
    try {
      const response = await apiFetch<ApiResponse<{ text: string; audio: string }>>(
        `/guest/explore/place/${encodeURIComponent(placeId)}/narration`,
        {
          method: "POST",
          body: JSON.stringify({
            targetLanguage: language,
            description,
          }),
        },
      );
      setSpokenText(response.data.text);
      await new Audio(response.data.audio).play();
    } finally {
      setSpeaking(false);
    }
  }

  if (error) return <div className="surface-card p-8 text-destructive">{error}</div>;
  if (!detail) return <div className="surface-card p-8">Loading place…</div>;
  const photos = detail.photos.filter((photo) => photo.photoUri);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link to="/explore">
          <ArrowLeft className="h-4 w-4" />
          Back to explore
        </Link>
      </Button>
      {photos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedPhoto(photo.photoUri)}
              aria-label={`View ${detail.name} photo ${index + 1}`}
              className={`group overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${index === 0 ? "sm:col-span-2" : ""}`}
            >
              <img
                src={photo.photoUri!}
                alt={`${detail.name} ${index + 1}`}
                className={`w-full object-cover transition duration-300 group-hover:scale-105 ${index === 0 ? "h-80" : "h-40"}`}
              />
            </button>
          ))}
        </div>
      )}
      <DialogPrimitive.Root
        open={selectedPhoto !== null}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-700/80 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none sm:p-8"
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelectedPhoto(null);
            }}
          >
            <DialogPrimitive.Title className="sr-only">
              {detail.name} photo preview
            </DialogPrimitive.Title>
            {selectedPhoto && (
              <img
                src={selectedPhoto}
                alt={`${detail.name} enlarged`}
                className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
              />
            )}
            <DialogPrimitive.Close
              className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white shadow-lg transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close image preview"
            >
              <X className="h-6 w-6" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold">{detail.name}</h1>
            <p className="mt-2 flex gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {detail.address}
            </p>
          </div>
          {detail.rating && (
            <p className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {detail.rating} ({detail.userRatingCount ?? 0} reviews)
            </p>
          )}
          <p className="leading-7 text-muted-foreground">
            {descriptionLoading ? "Creating a local guide description…" : description}
          </p>
          {spokenText && (
            <p className="rounded-xl bg-muted p-4 leading-7" dir="auto">
              {spokenText}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => void playDescription()}
              disabled={speaking || descriptionLoading || !description}
            >
              <Volume2 className="h-4 w-4" />
              {speaking ? "Generating…" : "Translate & play"}
            </Button>
            {detail.googleMapsUri && (
              <Button asChild variant="outline">
                <a href={detail.googleMapsUri} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Google Maps
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
