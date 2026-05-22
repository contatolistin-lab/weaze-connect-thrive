import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BlockedPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <XCircle className="mb-4 h-16 w-16 text-orange-500" />
      <h1 className="mb-2 text-2xl font-bold">Acesso Bloqueado</h1>
      <p className="mb-6 text-center text-muted-foreground max-w-md">
        Você não tem acesso a essa comunidade. Para mais informações, entre em contato com o administrador da comunidade.
      </p>
      <Button onClick={() => window.location.href = "/"}>
        Ir para página inicial
      </Button>
    </div>
  );
};

export default BlockedPage;
