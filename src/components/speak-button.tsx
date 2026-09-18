import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak, stopSpeak } from "@/lib/speech";

export function SpeakButton({
  text,
  label = "Hear this",
  size = "sm",
}: {
  text: string;
  label?: string;
  size?: "sm" | "default";
}) {
  const [on, setOn] = useState(false);

  useEffect(() => () => stopSpeak(), []);

  useEffect(() => {
    setOn(false);
    stopSpeak();
  }, [text]);

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={() => {
        if (on) {
          stopSpeak();
          setOn(false);
          return;
        }
        const started = speak(text, () => setOn(false));
        if (started) setOn(true);
      }}
    >
      {on ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      {on ? "Stop" : label}
    </Button>
  );
}
