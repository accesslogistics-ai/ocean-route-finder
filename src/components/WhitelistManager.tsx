import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Mail, 
  Globe, 
  Shield, 
  User as UserIcon,
  Loader2,
  Calendar,
  Clock
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCountries } from "@/hooks/useCountries";
import { useAuthContext } from "@/contexts/AuthContext";

interface WhitelistEntry {
  id: string;
  email: string;
  country: string;
  role: "admin" | "user";
  expires_at: string;
  created_at: string;
  renewed_at: string | null;
  notes: string | null;
}

const addEmailSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  country: z.string().min(1, "País é obrigatório"),
  role: z.enum(["admin", "user"]),
  notes: z.string().max(500, "Notas muito longas").optional(),
});

export function WhitelistManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: countries = [], isLoading: loadingCountries } = useCountries();

  const { data: whitelist = [], isLoading } = useQuery({
    queryKey: ["email-whitelist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_whitelist")
        .select("*")
        .order("expires_at", { ascending: true });

      if (error) throw error;
      return data as WhitelistEntry[];
    },
  });

  const addEmailMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addEmailSchema>) => {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 2);

      const { error } = await supabase
        .from("email_whitelist")
        .insert({
          email: data.email.toLowerCase(),
          country: data.country,
          role: data.role,
          expires_at: expiresAt.toISOString(),
          created_by: user?.id,
          notes: data.notes || null,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este email já está na whitelist");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: t("whitelist.emailAdded"),
        description: t("whitelist.emailAddedDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ["email-whitelist"] });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    },
  });

  const renewMutation = useMutation({
    mutationFn: async (id: string) => {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 2);

      const { error } = await supabase
        .from("email_whitelist")
        .update({
          expires_at: expiresAt.toISOString(),
          renewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t("whitelist.renewed"),
        description: t("whitelist.renewedDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ["email-whitelist"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_whitelist")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t("whitelist.removed"),
        description: t("whitelist.removedDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ["email-whitelist"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setEmail("");
    setCountry("");
    setRole("user");
    setNotes("");
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = addEmailSchema.safeParse({ email, country, role, notes });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    addEmailMutation.mutate(result.data);
  };

  const getStatus = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return { status: "expired", daysRemaining: 0, color: "destructive" as const };
    } else if (daysRemaining <= 15) {
      return { status: "expiring", daysRemaining, color: "warning" as const };
    } else {
      return { status: "active", daysRemaining, color: "default" as const };
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("whitelist.title")}
          </CardTitle>
          <CardDescription>
            {t("whitelist.subtitle")}
          </CardDescription>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("whitelist.addEmail")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("whitelist.addEmail")}</DialogTitle>
              <DialogDescription>
                {t("whitelist.addEmailDesc")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wl-email">Email *</Label>
                <Input
                  id="wl-email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={addEmailMutation.isPending}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wl-country">{t("common.country")} *</Label>
                <Select value={country} onValueChange={setCountry} disabled={loadingCountries}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCountries ? t("common.loading") : t("admin.selectCountry")} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {c}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-sm text-destructive">{errors.country}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wl-role">{t("admin.userType")} *</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "admin" | "user")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        {t("admin.user")}
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {t("admin.administrator")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wl-notes">{t("whitelist.notes")}</Label>
                <Textarea
                  id="wl-notes"
                  placeholder={t("whitelist.notesPlaceholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={addEmailMutation.isPending}
                  rows={2}
                />
              </div>

              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-2" />
                {t("whitelist.validityNote")}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={addEmailMutation.isPending}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={addEmailMutation.isPending}>
                  {addEmailMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : (
                    t("whitelist.addEmail")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : whitelist.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("whitelist.noEmails")}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>{t("common.country")}</TableHead>
                  <TableHead>{t("common.type")}</TableHead>
                  <TableHead>{t("whitelist.expiresAt")}</TableHead>
                  <TableHead>{t("whitelist.status")}</TableHead>
                  <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelist.map((entry) => {
                  const { status, daysRemaining, color } = getStatus(entry.expires_at);
                  
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Globe className="h-3 w-3" />
                          {entry.country}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.role === "admin" ? "default" : "secondary"}>
                          {entry.role === "admin" ? (
                            <><Shield className="h-3 w-3 mr-1" /> Admin</>
                          ) : (
                            <><UserIcon className="h-3 w-3 mr-1" /> {t("admin.user")}</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(entry.expires_at).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={color === "warning" ? "outline" : color}
                          className={color === "warning" ? "border-yellow-500 text-yellow-600 bg-yellow-50" : ""}
                        >
                          {status === "expired" && t("whitelist.expired")}
                          {status === "expiring" && `${daysRemaining} ${t("whitelist.daysRemaining")}`}
                          {status === "active" && t("whitelist.active")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => renewMutation.mutate(entry.id)}
                            disabled={renewMutation.isPending}
                            title={t("whitelist.renew")}
                          >
                            <RefreshCw className={`h-4 w-4 ${renewMutation.isPending ? "animate-spin" : ""}`} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("whitelist.confirmRemove")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("whitelist.confirmRemoveDesc")} <strong>{entry.email}</strong>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteMutation.mutate(entry.id)}
                                >
                                  {t("common.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
