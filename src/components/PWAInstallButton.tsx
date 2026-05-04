import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function PWAInstallButton() {
  const { install, canInstall } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={install}
      className="text-muted-foreground"
    >
      <Download className="w-4 h-4 mr-2" />
      Baixar aplicativo
    </Button>
  );
}
