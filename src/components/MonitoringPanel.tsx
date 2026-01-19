import { useState } from "react";
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

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 3 }, (_, i) => currentYear - i);
}

export function MonitoringPanel() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { userActivity, stats, isLoading } = useMonitoring(selectedYear, selectedMonth);

  const handleExportCSV = () => {
    if (userActivity.length === 0) return;

    const headers = ["Email", "Nome", "País", "Acessos", "Pesquisas", "Último Acesso"];
    const rows = userActivity.map((u) => [
      u.email,
      u.full_name || "-",
      u.country || "-",
      u.access_count,
      u.search_count,
      u.last_access ? new Date(u.last_access).toLocaleDateString("pt-BR") : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `monitoramento_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`;
    link.click();
  };

  const selectedMonthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label || "";

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={String(month.value)}>
                  {month.label}
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
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários Ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">em {selectedMonthLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Acessos Totais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAccesses}</div>
            <p className="text-xs text-muted-foreground">logins no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Pesquisas Totais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSearches}</div>
            <p className="text-xs text-muted-foreground">consultas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Média por Usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.averageSearchesPerUser.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">pesquisas/usuário</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividade por Usuário
          </CardTitle>
          <CardDescription>
            Detalhes de acessos e pesquisas em {selectedMonthLabel} de {selectedYear}
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
              <p>Nenhuma atividade registrada neste período</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead className="text-center">Acessos</TableHead>
                    <TableHead className="text-center">Pesquisas</TableHead>
                    <TableHead>Último Acesso</TableHead>
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
                          <span className="text-muted-foreground">Todos</span>
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
                          ? new Date(user.last_access).toLocaleDateString("pt-BR", {
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
