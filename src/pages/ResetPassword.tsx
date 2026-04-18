import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z
  .object({
    password: z.string().min(6, "Minimal 6 karakter").max(100),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Password tidak cocok",
    path: ["confirm"],
  });
type FormValues = z.infer<typeof schema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password berhasil diperbarui");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Masukkan password baru Anda</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="password">Password baru</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Konfirmasi password</Label>
            <Input id="confirm" type="password" {...register("confirm")} />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Perbarui password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
