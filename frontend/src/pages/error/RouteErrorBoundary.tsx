import { Button } from "@/components/ui/button";
import { Home, RefreshCw, ShieldAlert } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import NotFound from "./NotFound";
import Unauthorized from "./Unauthorized";


export default function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <NotFound />;
    }
    if (error.status === 403) {
      return <Unauthorized />;
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8 font-sans antialiased text-foreground">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4 border border-destructive/20 animate-pulse">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          An unexpected error occurred while loading this page. This can happen
          due to a temporary network lag or local file updates.
        </p>

        {import.meta.env.DEV && error instanceof Error && (
          <pre className="mt-4 p-3 bg-muted border border-border rounded-xl text-[10px] font-mono text-left overflow-x-auto max-h-40 scrollbar-hide select-all">
            {error.message}
          </pre>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="text-xs h-9 cursor-pointer gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload Page
          </Button>
          <Button
            variant="outline"
            asChild
            className="text-xs h-9 cursor-pointer gap-1.5 border-border hover:bg-muted"
          >
            <a href="/">
              <Home className="h-3.5 w-3.5" /> Return Home
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
