export function authError(error: unknown): string {
  const e = error as { code?: string; message?: string };
  const messages: Record<string, string> = {
    invalid_credentials: "E-mail ou senha incorretos.",
    email_not_confirmed: "Confirme seu e-mail antes de entrar.",
    user_already_exists:
      "Não foi possível criar a conta. Tente entrar ou recuperar sua senha.",
    weak_password: "Use uma senha mais forte, com pelo menos 8 caracteres.",
    over_email_send_rate_limit:
      "Muitos e-mails solicitados. Aguarde alguns minutos antes de tentar novamente.",
    over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos.",
    same_password: "Escolha uma senha diferente da atual.",
    otp_expired: "Este link expirou. Solicite um novo e-mail.",
    session_not_found: "Sua sessão expirou. Entre novamente.",
  };
  if (e?.code && messages[e.code]) return messages[e.code];
  if (e?.message?.toLowerCase().includes("fetch"))
    return "Não foi possível conectar. Confira sua internet e tente novamente.";
  return "Não foi possível concluir. Confira os dados e tente novamente. Se persistir, verifique a configuração de autenticação e e-mail do Supabase.";
}
