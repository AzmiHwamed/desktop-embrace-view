// routes/__root.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { Toaster } from "@/components/ui/sonner";
import { applyDocumentLanguage } from "../lib/language-preference";

import { makeStore, type AppStore } from "../app/store";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppLayout } from "../components/AppLayout";
import { SubscriptionGate } from "../components/SubscriptionGate";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";
import { TOKEN_STORAGE_KEY } from "@/lib/api-client";
import { getSession } from "@/lib/session-lifecycle";
import { toast } from "sonner";



function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          
            <a href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SmartTravel — Travel money workspace" },
      {
        name: "description",
        content:
          "Scan receipts, convert currency and track travel expenses in one responsive dashboard.",
      },
      { name: "author", content: "SmartTravel" },
      { property: "og:title", content: "SmartTravel — Travel money workspace" },
      {
        property: "og:description",
        content:
          "Scan receipts, convert currency and track travel expenses in one responsive dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const storeRef = useRef<AppStore | undefined>(undefined);
  if (!storeRef.current) storeRef.current = makeStore();

  useEffect(() => {
    applyDocumentLanguage();
  }, []);

  return (
    <Provider store={storeRef.current}>
      <QueryClientProvider client={queryClient}>
        <SessionContent queryClient={queryClient} />
      </QueryClientProvider>
    </Provider>
  );
}

function SessionContent({ queryClient }: { queryClient: QueryClient }) {
  const dispatch = useAppDispatch();
  // Every boundary resets auth, triggering this selector and a fresh UI tree.
  useAppSelector((state) => state.auth);
  const generation = getSession().generation;
  useEffect(() => {
    queryClient.clear();
    toast.dismiss();
  }, [generation, queryClient]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if ((event.key === TOKEN_STORAGE_KEY && !event.newValue) || event.key === null) {
        dispatch(logout());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);
  return (
    <div key={generation} className="contents">
      <AppLayout>
        <SubscriptionGate><Outlet /></SubscriptionGate>
      </AppLayout>
      <Toaster />
    </div>
  );
}
