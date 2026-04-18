import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(6, "Minimal 6 karakter").max(100),
});

type FormValues = z.infer<typeof schema>;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Selamat datang kembali");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-semibold">
            E
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Masuk ke Event Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">Internal team workspace</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Lupa password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
