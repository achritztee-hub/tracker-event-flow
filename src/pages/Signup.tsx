import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const schema = z
  .object({
    full_name: z.string().trim().min(2, "Minimal 2 karakter").max(100),
    email: z.string().trim().email("Email tidak valid").max(255),
    password: z.string().min(6, "Minimal 6 karakter").max(100),
    confirm: z.string(),
    role_id: z.string().min(1, "Pilih peran"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Password tidak cocok",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

interface Role {
  role_id: string;
  display_name: string;
  team: string;
  max_capacity: number;
  current_count: number;
}

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role_id: "" },
  });
  const selectedRole = watch("role_id");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("roles_capacity")
        .select("role_id, display_name, team, max_capacity, current_count")
        .order("display_name");
      if (!error && data) setRoles(data as Role[]);
      setRolesLoading(false);
    })();
  }, []);

  const onSubmit = async (values: FormValues) => {
    const role = roles.find((r) => r.role_id === values.role_id);
    if (!role) return;
    if (role.current_count >= role.max_capacity) {
      toast.error("Posisi ini sudah penuh. Silakan pilih peran lain.");
      return;
    }

    setLoading(true);
    const redirectUrl = `${window.location.origin}/login`;
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: values.full_name,
          role_id: values.role_id,
        },
      },
    });
    setLoading(false);

    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("role_full")) {
        toast.error("Posisi ini sudah penuh. Silakan pilih peran lain.");
      } else if (msg.includes("already")) {
        toast.error("Email sudah terdaftar.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Akun berhasil dibuat. Cek email Anda untuk konfirmasi.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-semibold">
            E
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Buat akun</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bergabung dengan tim</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Konfirmasi Password</Label>
            <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Peran</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setValue("role_id", v, { shouldValidate: true })}
              disabled={rolesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={rolesLoading ? "Memuat peran..." : "Pilih peran"} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => {
                  const remaining = r.max_capacity - r.current_count;
                  const full = remaining <= 0;
                  return (
                    <SelectItem key={r.role_id} value={r.role_id} disabled={full}>
                      {r.display_name} ({full ? "penuh" : `${remaining} slot tersisa`})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.role_id && <p className="text-xs text-destructive">{errors.role_id.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading || rolesLoading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat akun"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
