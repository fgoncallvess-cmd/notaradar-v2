# NotaRadar 2.0 — Deep Violet

Acompanhamento acadêmico de 2026 com React, TypeScript, Vite e Supabase.

**Comece pelo [INICIAR_AQUI.md](INICIAR_AQUI.md).** Ele explica como preservar as pastas, configurar autenticação e banco e publicar na Vercel. Sem variáveis de ambiente, o aplicativo mostra a tela de conexão pendente.

## Funcionalidades

- Login, cadastro, confirmação de e-mail, recuperação de senha e saída da conta.
- Dados acadêmicos por usuário no Supabase, protegidos por RLS.
- Dashboard, notas, simulador, metas, paralelas e configurações.
- Escolha de acompanhamento mínimo 22/11 ou objetivo 24/12; aprovação permanece 22/11.
- Vários pontos extras nomeados por bimestre, somados depois da paralela, teto final 10.
- Exportação JSON, importação de backups v1/v2 e migração local mediante escolha explícita.
- Controle de revisão para impedir sobrescrita acidental entre abas.

## Desenvolvimento

Node.js 22 ou superior. Copie `.env.example` para `.env.local` e configure o Supabase conforme o guia.

```bash
npm install
npm run dev -- --host 0.0.0.0
npm test
npm run build
```

## Organização

| Caminho                   | Conteúdo                                                |
| ------------------------- | ------------------------------------------------------- |
| `src/pages`               | Páginas do aplicativo e autenticação                    |
| `src/components`          | Editor de notas, extras e componentes compartilhados    |
| `src/lib/calculations.ts` | Regras acadêmicas e simulações                          |
| `src/lib/storage.ts`      | Validação e migração de backups                         |
| `src/lib/cloud.ts`        | Carregamento e salvamento com revisão                   |
| `src/AuthGate.tsx`        | Sessão e carregamento da conta                          |
| `supabase/schema.sql`     | Tabela, políticas e função SQL                          |
| `tests`                   | Cálculos, migração e isolamento em PostgreSQL embarcado |
| `vercel.json`             | Configuração do build e cabeçalhos                      |

O banco guarda um documento JSON por usuário/ano. A função SQL usa a identidade autenticada, e as políticas restringem leitura e escrita à própria conta. Não há chave administrativa no aplicativo. O salvamento requer conexão; sincronização em tempo real e funcionamento offline não estão implementados.

A interface e os testes locais não substituem a validação de e-mails, sessão e salvamento no seu projeto Supabase após configurá-lo. Nenhuma conta externa ou implantação é criada automaticamente por este pacote.
