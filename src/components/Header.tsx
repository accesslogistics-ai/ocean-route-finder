import { Anchor, Waves } from "lucide-react";
import { ImportTariffs } from "./ImportTariffs";

export function Header() {
  return (
    <header className="bg-card border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground">
              <Anchor className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
                Tarifário Marítimo
                <Waves className="h-5 w-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Consulta e comparativo de tarifas de frete
              </p>
            </div>
          </div>
          <ImportTariffs />
        </div>
      </div>
    </header>
  );
}
