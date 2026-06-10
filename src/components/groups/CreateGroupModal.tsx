import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/compressImage";

type CreateGroupModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, type: "private" | "internal", image?: string | null) => Promise<void>;
};

export function CreateGroupModal({ open, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"private" | "internal">("private");
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const dataUrl = await compressImage(file);
      setImagePreview(dataUrl);
      setImageFile(file);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
    setCompressing(false);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onCreate(name, type, imagePreview);
    setSaving(false);
    setName("");
    setType("private");
    setImagePreview(null);
    setImageFile(null);
    onClose();
  };

  const handleClose = () => {
    if (!saving) {
      setName("");
      setType("private");
      setImagePreview(null);
      setImageFile(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar grupo</DialogTitle>
          <DialogDescription>
            Crie um grupo para organizar membros da sua comunidade.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="group-name">Nome do grupo</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Equipe Premium"
              maxLength={80}
            />
          </div>
          <div>
            <Label>Tipo do grupo</Label>
            <div className="flex gap-4 mt-2">
              <label
                className={cn(
                  "flex items-center gap-2 cursor-pointer p-3 rounded-xl border flex-1 transition-all",
                  type === "private"
                    ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500/20"
                    : "border-border hover:bg-secondary"
                )}
              >
                <input
                  type="radio"
                  name="group-type"
                  value="private"
                  checked={type === "private"}
                  onChange={() => setType("private")}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    type === "private" ? "bg-purple-100" : "bg-gray-100"
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(
                      "h-4 w-4",
                      type === "private" ? "text-purple-600" : "text-gray-400"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Privado</p>
                  <p className="text-xs text-muted-foreground">Apenas membros</p>
                </div>
              </label>
              <label
                className={cn(
                  "flex items-center gap-2 cursor-pointer p-3 rounded-xl border flex-1 transition-all",
                  type === "internal"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                    : "border-border hover:bg-secondary"
                )}
              >
                <input
                  type="radio"
                  name="group-type"
                  value="internal"
                  checked={type === "internal"}
                  onChange={() => setType("internal")}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    type === "internal" ? "bg-blue-100" : "bg-gray-100"
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(
                      "h-4 w-4",
                      type === "internal" ? "text-blue-600" : "text-gray-400"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Interno</p>
                  <p className="text-xs text-muted-foreground">Equipe</p>
                </div>
              </label>
            </div>
          </div>
          <div>
            <Label>Imagem do grupo (opcional)</Label>
            <div className="mt-2 flex items-center gap-3">
              {imagePreview ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border">
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors"
                >
                  {compressing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
              />
              {!imagePreview && (
                <span className="text-xs text-muted-foreground">
                  PNG, JPG ou GIF (máx. 32×32)
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1" disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              className="flex-1 bg-brand text-primary-foreground hover:opacity-90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}