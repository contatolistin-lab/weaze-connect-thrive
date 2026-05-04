import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function PWAInstallButton() {
  const { install, canInstall, isIOS, isInstalled } = usePWAInstall();

  if (isInstalled) return null;

  const label = canInstall || isIOS ? "Instalar app" : "Como instalar";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={install}
      className="text-muted-foreground"
      aria-label={label}
    >
      <Download className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
