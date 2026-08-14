import { useState } from "react";
import { Check, ExternalLink, LocateFixed, MapPin, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InlineLoading } from "@/components/Loading";
import { useTranslations } from "@/app/hooks";
import scanStrings from "@/locales/en/scan.json";
import { matchReceiptMerchant } from "./merchant-match.server";
import type { MerchantCandidate } from "./merchant-types";
import type { Receipt } from "./types";

type Props = {
  receipt: Receipt;
  selected: MerchantCandidate | null;
  languageCode?: string;
  onSelect: (candidate: MerchantCandidate | null) => void;
};

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    });
  });
}

export function MerchantMatcher({ receipt, selected, languageCode, onSelect }: Props) {
  const t = useTranslations("scan", scanStrings);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<MerchantCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setOpen(true);
    setLoading(true);
    setError(null);
    setCandidates([]);
    try {
      const position = await getPosition();
      const response = await matchReceiptMerchant({ data: {
        merchantName: receipt.merchant ?? "",
        receiptAddress: receipt.address,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        languageCode,
      } });
      setCandidates(response.candidates);
    } catch (reason) {
      if (typeof reason === "object" && reason && "code" in reason) {
        setError(t.locationError);
      } else {
        setError(reason instanceof Error ? reason.message : t.placeSearchError);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!receipt.merchant?.trim()) return null;

  return <>
    <div className="border-b bg-primary/[0.04] p-4">
      {selected ? <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Check className="h-4 w-4" /></span><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{t.matchedEstablishment}</p><p className="truncate text-sm font-bold">{selected.name}</p><p className="truncate text-xs text-muted-foreground">{selected.address}</p></div></div>
        <Button size="sm" variant="outline" onClick={search}>{t.changeMatch}</Button>
      </div> : <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{t.findRealMerchant}</p><p className="text-xs text-muted-foreground">{t.findRealMerchantHint}</p></div><Button size="sm" variant="outline" onClick={search}><LocateFixed className="h-4 w-4" />{t.findNearby}</Button></div>}
    </div>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{t.chooseEstablishment}</DialogTitle><DialogDescription>{t.chooseEstablishmentHint}</DialogDescription></DialogHeader>
        {loading ? <div className="grid min-h-40 place-items-center"><InlineLoading label={t.searchingNearby} /></div> : error ? <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : candidates.length === 0 ? <div className="py-8 text-center"><Search className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-semibold">{t.noEstablishments}</p><p className="text-sm text-muted-foreground">{t.noEstablishmentsHint}</p></div> : <div className="space-y-2">{candidates.map((candidate) => <button key={candidate.placeId} type="button" onClick={() => { onSelect(candidate); setOpen(false); }} className="flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition hover:border-primary hover:bg-primary/[0.04]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block font-bold">{candidate.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{candidate.address}</span><span className="mt-2 flex gap-2 text-xs"><span>{candidate.distanceMeters < 1000 ? `${candidate.distanceMeters} m` : `${(candidate.distanceMeters / 1000).toFixed(1)} km`}</span><span>·</span><span>{candidate.confidence}% {t.match}</span></span></span>{candidate.googleMapsUri && <a href={candidate.googleMapsUri} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={t.openMaps} className="rounded-lg p-2 hover:bg-muted"><ExternalLink className="h-4 w-4" /></a>}</button>)}</div>}
        <DialogFooter className="gap-2"><Button variant="outline" onClick={() => { onSelect(null); setOpen(false); }}><X className="h-4 w-4" />{t.keepExtractedMerchant}</Button>{!loading && <Button variant="ghost" onClick={search}>{t.searchAgain}</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
