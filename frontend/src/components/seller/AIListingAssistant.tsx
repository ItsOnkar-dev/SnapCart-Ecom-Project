import { Button } from "@/components/ui/button";
import {
  useGenerateListing,
  useListingDrafts,
} from "@/hooks/useListingAssistant";
import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/product-form";
import type { GeneratedListing } from "@/types/seller.types";
import { History, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";

interface AIListingAssistantProps {
  onApply: (listing: GeneratedListing) => void;
  currentCategory?: string;
}

export function AIListingAssistant({
  onApply,
  currentCategory,
}: AIListingAssistantProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  const { mutate: generate, isPending } = useGenerateListing();
  const { data: drafts = [], isLoading: isLoadingDrafts } = useListingDrafts();

  const handleGenerate = () => {
    if (input.trim().length < 2) return;
    generate(
      {
        input: input.trim(),
        category: currentCategory as
          | (typeof PRODUCT_CATEGORY_OPTIONS)[number]
          | undefined,
      },
      {
        onSuccess: (listing) => {
          onApply(listing);
          setIsOpen(false);
          setInput("");
        },
      },
    );
  };

  const handleSelectDraft = (listing: GeneratedListing) => {
    onApply(listing);
    setIsOpen(false);
    setShowDrafts(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left group cursor-pointer"
      >
        <Sparkles className="size-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">
            AI Listing Assistant
          </p>
          <p className="text-xs text-muted-foreground">
            Describe your product and let AI fill the form
          </p>
        </div>
        <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          Try it →
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <p className="text-xs font-semibold text-foreground">
            AI Listing Assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDrafts(!showDrafts)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <History className="size-3.5" />
            {showDrafts ? "Prompt" : `Recent drafts (${drafts.length})`}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setShowDrafts(false);
              setInput("");
            }}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {showDrafts ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Click any previous generation to apply it:
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {isLoadingDrafts ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                Loading drafts…
              </p>
            ) : drafts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                No drafts generated yet.
              </p>
            ) : (
              drafts.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => handleSelectDraft(d.listing)}
                  className="w-full text-left p-2 rounded border border-border bg-background hover:bg-muted/40 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {d.listing?.name || d.input}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      ₹{d.listing?.price} · {d.listing?.category}
                    </p>
                  </div>
                  <span className="text-[10px] text-primary shrink-0">
                    Apply
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Type anything — a product name, keywords, or rough description. AI
            will generate the full listing.
          </p>

          <div className="space-y-1.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              rows={3}
              placeholder={
                "e.g. boat airdopes 141 wireless earbuds\nor: red nike air max running shoes size 10\nor: harry potter and the philosopher's stone paperback"
              }
              disabled={isPending}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring resize-none disabled:opacity-50"
            />
            <p className="text-[10px] text-muted-foreground">
              Press Ctrl+Enter to generate
            </p>
          </div>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={input.trim().length < 2 || isPending}
            className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium text-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Generating listing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-3.5" />
                Generate listing
              </>
            )}
          </Button>

          {isPending && (
            <p className="text-xs text-muted-foreground text-center">
              Usually takes 1–2 seconds with Groq ⚡
            </p>
          )}
        </>
      )}
    </div>
  );
}
