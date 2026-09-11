import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ozlglqyvgzjdzzraqsjx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_no1GG2UThfw01vxljqSItg_Mk_ZAgHt";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
