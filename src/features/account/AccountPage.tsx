import { LogOut, MapPin, Plane, Receipt } from "lucide-react";

import { PageHeader } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencies } from "@/lib/travel-data";


export function AccountPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Account" subtitle="Profile and travel preferences" />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Trips logged" value="14" hint="6 countries" icon={Plane} tone="brand" />
        <StatCard label="Receipts" value="382" hint="Since 2024" icon={Receipt} />
        <StatCard label="Home base" value="Lisbon" hint="Europe/Lisbon" icon={MapPin} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr] lg:gap-6">
        <div className="surface-card p-6 text-center">
          <Avatar className="mx-auto h-20 w-20">
            <AvatarFallback className="bg-brand text-xl font-extrabold text-primary-foreground">
              AL
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-4 font-display text-lg font-bold">Alex Lang</h2>
          <p className="text-sm text-muted-foreground">alex.lang@smarttravel.app</p>
          <p className="mt-3 inline-flex rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Traveller Pro
          </p>
          <Button variant="outline" className="mt-5 w-full rounded-xl">
            Change photo
          </Button>
          <Button variant="ghost" className="mt-2 w-full rounded-xl text-destructive">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>

        <div className="surface-card p-5 lg:p-6">
          <h2 className="font-display text-lg font-bold">Edit profile</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" defaultValue="Alex" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" defaultValue="Lang" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue="alex.lang@smarttravel.app"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue="+351 912 004 118" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Home currency</Label>
              <Select defaultValue="EUR">
                <SelectTrigger id="currency" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button className="bg-brand rounded-xl shadow-brand">Save changes</Button>
            <Button variant="ghost" className="rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
