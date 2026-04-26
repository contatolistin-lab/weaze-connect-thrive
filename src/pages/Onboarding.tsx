import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateBrandDialog from "@/components/CreateBrandDialog";

export default function Onboarding() {
  const nav = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) nav("/feed");
  }, [open, nav]);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-soft pointer-events-none" />
      <CreateBrandDialog open={open} onOpenChange={setOpen} onCreated={() => nav("/feed")} />
    </main>
  );
}
