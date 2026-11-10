import { supabase } from "./supabase";
import { fresh } from "./data";
import { validate } from "./storage";
import type { Data } from "./types";
export type Snapshot = { data: Data; revision: number };
export async function loadAccount(userId: string): Promise<Snapshot> {
  if (!supabase) throw new Error("Supabase ainda não configurado.");
  const { data, error } = await supabase
    .from("notaradar_data")
    .select("payload,revision")
    .eq("user_id", userId)
    .eq("year", 2026)
    .maybeSingle();
  if (error)
    throw new Error(
      "Não foi possível carregar seus dados. Confira sua conexão e se o SQL de instalação foi executado.",
    );
  if (!data) return { data: fresh(), revision: 0 };
  return { data: validate(data.payload), revision: data.revision };
}
export async function saveAccount(
  data: Data,
  expectedRevision: number,
): Promise<number> {
  if (!supabase) throw new Error("Supabase ainda não configurado.");
  const payload = validate(data);
  const { data: revision, error } = await supabase.rpc("save_notaradar_data", {
    p_payload: payload,
    p_expected_revision: expectedRevision,
  });
  if (error) {
    if (error.message.includes("revision_conflict"))
      throw new Error(
        "Seus dados mudaram em outra aba ou dispositivo. A alteração não foi salva. Baixe a tentativa como backup e recarregue os dados antes de tentar novamente.",
      );
    throw new Error(
      "Não foi possível salvar na nuvem. Confira a conexão. Sua alteração permanece neste formulário para tentar novamente.",
    );
  }
  if (typeof revision !== "number")
    throw new Error(
      "O servidor não confirmou o salvamento. Recarregue os dados antes de tentar novamente.",
    );
  return revision;
}
