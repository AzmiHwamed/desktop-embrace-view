import { Link } from "@tanstack/react-router";
import { Coins } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function TokenPurchaseDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("smarttravel:tokens-insufficient", show);
    return () => window.removeEventListener("smarttravel:tokens-insufficient", show);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-2 grid h-11 w-11 place-items-center rounded-full bg-amber-500/15 text-amber-700"><Coins className="h-5 w-5" /></span>
          <DialogTitle>Not enough tokens</DialogTitle>
          <DialogDescription>This AI service needs more tokens than are available in your wallet. Choose a token package to continue.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Not now</Button>
          <Button asChild onClick={() => setOpen(false)}><Link to="/subscribe">Get tokens</Link></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
