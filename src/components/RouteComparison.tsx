import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tariff } from "@/hooks/useTariffs";
import { Ship, Clock, Calendar, TrendingDown, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCALE_MAP, type SupportedLanguage } from "@/i18n";

interface RouteComparisonProps {
  tariffs: Tariff[];
  isLoading?: boolean;
}

function formatPrice(price: number | null, locale: string): string {
  if (price === null || price === undefined) return "-";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function findBestPrice(tariffs: Tariff[], field: keyof Pick<Tariff, "price_20dc" | "price_40hc" | "price_40reefer">) {
  const prices = tariffs.map((t) => t[field]).filter((p): p is number => p !== null);
  return prices.length > 0 ? Math.min(...prices) : null;
}

function findBestTT(tariffs: Tariff[]) {
  const tts = tariffs
    .map((t) => {
      const match = t.transit_time?.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    })
    .filter((t): t is number => t !== null);
  return tts.length > 0 ? Math.min(...tts) : null;
}

export function RouteComparison({ tariffs, isLoading }: RouteComparisonProps) {
  const { t, i18n } = useTranslation();
  const locale = LOCALE_MAP[i18n.language as SupportedLanguage] || "pt-BR";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">{t("tariffs.loadingComparison")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tariffs.length === 0) {
    return null;
  }

  const best20dc = findBestPrice(tariffs, "price_20dc");
  const best40hc = findBestPrice(tariffs, "price_40hc");
  const best40reefer = findBestPrice(tariffs, "price_40reefer");
  const bestTT = findBestTT(tariffs);

  const route = `${tariffs[0].pol} → ${tariffs[0].pod}`;

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          {t("tariffs.priceComparison")}: {route}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {tariffs.length} {t("tariffs.carriersAvailable")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tariffs.map((tariff, index) => {
            const isBest20dc = tariff.price_20dc === best20dc && best20dc !== null;
            const isBest40hc = tariff.price_40hc === best40hc && best40hc !== null;
            const isBest40reefer = tariff.price_40reefer === best40reefer && best40reefer !== null;
            const ttValue = tariff.transit_time?.match(/\d+/)?.[0];
            const isBestTT = ttValue && parseInt(ttValue) === bestTT;
            const hasBestPrice = isBest20dc || isBest40hc || isBest40reefer;

            return (
              <Card
                key={tariff.id}
                className={cn(
                  "relative overflow-hidden transition-all hover:shadow-md animate-fade-in",
                  hasBestPrice && "ring-2 ring-success/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {hasBestPrice && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-success text-success-foreground gap-1">
                      <Award className="h-3 w-3" />
                      {t("tariffs.bestPrice")}
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Ship className="h-5 w-5 text-primary" />
                    <span className="font-heading text-lg font-semibold">{tariff.carrier}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">20'DC</span>
                      <span
                        className={cn(
                          "font-mono font-medium",
                          isBest20dc && "text-success"
                        )}
                      >
                        {formatPrice(tariff.price_20dc, locale)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">40'HC</span>
                      <span
                        className={cn(
                          "font-mono font-medium",
                          isBest40hc && "text-success"
                        )}
                      >
                        {formatPrice(tariff.price_40hc, locale)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">40'Reefer</span>
                      <span
                        className={cn(
                          "font-mono font-medium",
                          isBest40reefer && "text-success"
                        )}
                      >
                        {formatPrice(tariff.price_40reefer, locale)}
                      </span>
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t("tariffs.transitTime")}
                        </span>
                        <span className={cn("text-sm font-medium", isBestTT && "text-success")}>
                          {tariff.transit_time || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground">{t("tariffs.freeTime")}</span>
                        <span className="text-sm font-medium">{tariff.free_time || "-"}</span>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t("tariffs.validity")}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {tariff.validity || "-"}
                        </Badge>
                      </div>
                    </div>

                    {tariff.subject_to && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-xs text-muted-foreground">{tariff.subject_to}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
