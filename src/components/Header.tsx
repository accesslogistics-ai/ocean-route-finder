import { Link } from "react-router-dom";
import { Anchor, Waves, LogOut, Settings, User } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSimulation } from "@/contexts/SimulationContext";
import { ImportTariffs } from "./ImportTariffs";
import { SimulationBanner } from "./SimulationBanner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { user, isAdmin, signOut } = useAuthContext();
  const { isSimulating } = useSimulation();

  return (
    <>
      <SimulationBanner />
      <header className={`bg-card border-b ${isSimulating ? "mt-12" : ""}`}>
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

          <div className="flex items-center gap-3">
            {/* Admin management button - visible only to admins */}
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link to="/admin" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Gerenciar Usuários</span>
                </Link>
              </Button>
            )}
            
            {/* Only show import button for admins */}
            {isAdmin && <ImportTariffs />}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-[150px] truncate">
                    {user?.email}
                  </span>
                  {isAdmin && (
                    <Badge variant="secondary" className="ml-1">
                      Admin
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Gerenciar Usuários
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      </header>
    </>
  );
}
