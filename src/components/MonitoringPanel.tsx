import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Search, Activity, TrendingUp, Loader2, Download } from "lucide-react";
import { useMonitoring } from "@/hooks/useMonitoring";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LOCALE_MAP, type SupportedLanguage } from "@/i18n";

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 3 }, (_, i) => currentYear - i);
}

export function MonitoringPanel() {
  const { t, i18n } = useTranslation();
  const locale = LOCALE_MAP[i18n.language as SupportedLanguage] || "pt-BR";
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { userActivity, stats, isLoading } = useMonitoring(selectedYear, selectedMonth);

  const MONTHS = [
    { value: 0, labelKey: "monitoring.allMonths" },
    { value: 1, labelKey: "months.january" },
    { value: 2, labelKey: "months.february" },
    { value: 3, labelKey: "months.march" },
    { value: 4, labelKey: "months.april" },
    { value: 5, labelKey: "months.may" },
    { value: 6, labelKey: "months.june" },
    { value: 7, labelKey: "months.july" },
    { value: 8, labelKey: "months.august" },
    { value: 9, labelKey: "months.september" },
    { value: 10, labelKey: "months.october" },
    { value: 11, labelKey: "months.november" },
    { value: 12, labelKey: "months.december" },
  ];

  const handleExportCSV = () => {
    if (userActivity.length === 0) return;

    const headers = [
      t("common.email"),
      t("common.name"),
      t("common.country"),
      t("monitoring.accesses"),
      t("monitoring.searches"),
      t("monitoring.lastAccess"),
    ];
    const rows = userActivity.map((u) => [
      u.email,
      u.full_name || "-",
      u.country || "-",
      u.access_count,
      u.search_count,
      u.last_access ? new Date(u.last_access).toLocaleDateString(locale) : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `monitoring_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`;
    link.click();
  };

  const selectedMonthLabel = selectedMonth === 0 
    ? t("monitoring.allMonths")
    : t(MONTHS.find((m) => m.value === selectedMonth)?.labelKey || "");

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{t("monitoring.period")}:</span>
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={String(month.value)}>
                  {t(month.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getYearOptions().map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExportCSV}
          disabled={userActivity.length === 0}
        >
          <Download className="h-4 w-4" />
          {t("monitoring.exportCSV")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("monitoring.activeUsers")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">{t("monitoring.inPeriod")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t("monitoring.totalAccesses")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAccesses}</div>
            <p className="text-xs text-muted-foreground">{t("monitoring.loginsInPeriod")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t("monitoring.totalSearches")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSearches}</div>
            <p className="text-xs text-muted-foreground">{t("monitoring.queriesPerformed")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("monitoring.averagePerUser")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.averageSearchesPerUser.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">{t("monitoring.searchesPerUser")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t("monitoring.activityByUser")}
          </CardTitle>
          <CardDescription>
            {t("monitoring.activityDetails")} {selectedMonthLabel} {t("monitoring.of")} {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("monitoring.noActivity")}</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("monitoring.user")}</TableHead>
                    <TableHead>{t("common.country")}</TableHead>
                    <TableHead className="text-center">{t("monitoring.accesses")}</TableHead>
                    <TableHead className="text-center">{t("monitoring.searches")}</TableHead>
                    <TableHead>{t("monitoring.lastAccess")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userActivity.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          {user.full_name && (
                            <div className="text-sm text-muted-foreground">
                              {user.full_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.country ? (
                          <Badge variant="outline">{user.country}</Badge>
                        ) : (
                          <span className="text-muted-foreground">{t("admin.allCountries")}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={user.access_count > 0 ? "default" : "secondary"}>
                          {user.access_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={user.search_count > 0 ? "default" : "secondary"}>
                          {user.search_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.last_access
                          ? new Date(user.last_access).toLocaleDateString(locale, {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
