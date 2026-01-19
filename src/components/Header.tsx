import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Waves, LogOut, Settings, User, Eye } from "lucide-react";
import accessLogo from "@/assets/logo.png";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSimulation } from "@/contexts/SimulationContext";
import { useCountries } from "@/hooks/useCountries";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/LanguageSelector";

export function Header() {
  const { t } = useTranslation();
  const { user, isAdmin, signOut } = useAuthContext();
  const { isSimulating, startSimulation } = useSimulation();
  const { data: countries = [] } = useCountries();

  return (
    <header className="bg-card border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={accessLogo} 
              alt="Access Logo" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
                {t("header.title")}
                <Waves className="h-5 w-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("header.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language selector */}
            <LanguageSelector />

            {/* Simulation dropdown - visible only to admins */}
            {isAdmin && !isSimulating && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("header.simulateUser")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                    {t("header.selectCountry")}
                  </div>
                  <DropdownMenuSeparator />
                  {countries.map((country) => (
                    <DropdownMenuItem
                      key={country}
                      onClick={() => startSimulation(country)}
                      className="cursor-pointer"
                    >
                      {country}
                    </DropdownMenuItem>
                  ))}
                  {countries.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {t("header.noCountries")}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Admin management button - visible only to admins */}
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link to="/admin" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("header.administration")}</span>
                </Link>
              </Button>
            )}

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
                        {t("header.administration")}
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
                  {t("header.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
