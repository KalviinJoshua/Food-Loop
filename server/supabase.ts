import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Read Supabase configuration from .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check that the Supabase URL exists
if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is missing from .env");
}

// Check that the Supabase secret key exists
if (!supabaseSecretKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing from .env");
}

// Create the Supabase server client
export const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey
);