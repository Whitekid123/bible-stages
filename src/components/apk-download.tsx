import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ApkDownload() {
  if (import.meta.env.VITE_LOCAL_HALL === "true") return null;
  return (
    <div className="rounded-xl border-2 border-accent bg-bg-elevated p-5 shadow-lift">
      <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Android phone</p>
      <h2 className="mt-1 font-display text-2xl tracking-tight">Download the app</h2>
      <p className="mt-2 text-sm text-muted">
        This is the Bible Stages app file. Save it on the phone, then tap it to install. After
        that, open the icon on the home screen — not Chrome.
      </p>
      <Button asChild size="lg" className="mt-4 w-full">
        <a href="/BibleStages.apk" download="BibleStages.apk">
          <Download className="size-4" />
          Download Bible Stages
        </a>
      </Button>
      <p className="mt-3 text-xs text-muted">
        File name: <span className="font-medium text-fg">BibleStages.apk</span>
        {" · "}
        If the phone asks to allow installs, turn it on, then tap the file again.
      </p>
    </div>
  );
}
