import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mark } from "@/components/mark";
import { NaveMotif } from "@/components/nave-motif";

export const Route = createFileRoute("/download")({ component: DownloadPage });

function DownloadPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <section className="nave-panel app-status relative min-h-dvh px-6 py-12 text-accent-fg sm:px-10">
        <NaveMotif className="pointer-events-none absolute -right-8 top-8 w-48 opacity-70 lg:w-72" />
        <div className="relative mx-auto max-w-lg">
          <div className="flex items-center gap-3">
            <Mark />
            <p className="text-sm font-medium tracking-[0.18em] uppercase text-accent-fg/70">
              Get the app
            </p>
          </div>
          <h1 className="mt-8 font-display text-[clamp(3rem,8vw,5rem)] leading-[0.92] tracking-tight">
            Bible Stages
          </h1>
          <p className="mt-5 text-lg text-accent-fg/80">
            Tap download on an Android phone. Then open the file and tap Install. After that, use
            the Bible Stages icon — not this page.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-14 w-full bg-accent-fg text-accent hover:bg-accent-fg/90"
          >
            <a href="/BibleStages.apk" download="BibleStages.apk">
              <Download className="size-5" />
              Download the app
            </a>
          </Button>
          <p className="mt-4 text-sm text-accent-fg/70">
            File: BibleStages.apk · If the phone says the file is uncommon, tap Keep / Download
            anyway. Then allow installs from this browser.
          </p>
          <p className="mt-8 text-sm">
            <Link to="/" className="underline underline-offset-4">
              Back to class login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
