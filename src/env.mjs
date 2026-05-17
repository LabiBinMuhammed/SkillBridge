import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    // SERVER-side ONLY variables
    // These will NEVER be bundled into the client, preventing accidental leaks.
    server: {
        SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Service Role Key is required"),
        NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    },

    // CLIENT-side ONLY variables
    // Must be prefixed with NEXT_PUBLIC_
    client: {
        NEXT_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid URL"),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Anon Key is required"),
        NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    },

    // Manual routing of process.env is required for Next.js edge runtimes
    runtimeEnv: {
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },

    // Treat empty strings as missing variables
    emptyStringAsUndefined: true,
});

