# NotaRadar 2.0 — começar e publicar

Esta versão tem login real com Supabase. Sem configurar seu projeto, a tela abre com “Conexão pendente”; não existe conta de demonstração. O código está preparado, mas nenhum projeto Supabase ou deploy Vercel foi criado por este ZIP.

## 1. Preserve suas notas e as pastas

Na versão antiga, exporte o backup JSON em Configurações antes de trocar o projeto. Guarde também uma cópia do código antigo. Os dados locais pertencem ao navegador e endereço em que foram cadastrados; trocar o endereço não transfere os dados.

Extraia o ZIP inteiro. Dentro dele existe uma pasta `NotaRadar`, contendo `src`, `tests`, `supabase` e os arquivos de configuração. Não envie os arquivos de `src` soltos para a raiz: isso causa o erro `/src/main.tsx` não encontrado.

No Codespaces, uma opção é enviar o ZIP e extrair pelo terminal em uma pasta nova (ajuste o nome do ZIP se necessário):

```bash
unzip NotaRadar_2.0_Supabase.zip -d notaradar-v2
cd notaradar-v2/NotaRadar
```

Abra essa pasta no editor. Execute os comandos seguintes na pasta que contém `package.json`.

## 2. Node e dependências

Use Node.js 22 ou superior. Se seu Codespaces tem nvm:

```bash
nvm install 22
nvm use 22
npm install
```

Se não houver nvm, instale Node.js 22 pelo método adequado ao seu ambiente. Confira com `node --version`.

## 3. Crie e configure o Supabase

1. Crie seu projeto no painel do Supabase.
2. Abra o SQL Editor, copie todo o conteúdo de `supabase/schema.sql` e execute. Ele cria a tabela, as políticas por usuário e a função de salvamento. Não desative RLS.
3. Em Authentication, habilite login por e-mail e senha. Mantenha confirmação de e-mail e configure senha mínima de 8 caracteres.
4. Para cadastrar usuários fora da equipe do projeto, configure um provedor SMTP próprio. O serviço padrão de e-mail do Supabase tem restrições e não serve como configuração final de um lançamento público.
5. Copie a URL do projeto e sua chave **publishable** em API Keys. A chave legada `anon` também é aceita. Nunca use `service_role`, `sb_secret_` ou senha do banco no front-end.

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha os dois valores no editor:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

Não coloque aspas extras, espaços no valor ou credenciais administrativas. O arquivo `.env.local` é ignorado pelo Git. As variáveis `VITE_` ficam públicas no build; o isolamento das notas é feito pelas políticas do banco e pela sessão autenticada.

## 4. Configure os links de e-mail

Em Authentication → URL Configuration, durante o desenvolvimento use como Site URL o endereço em que você abre o aplicativo.

Em Redirect URLs, adicione o endereço completo com `/` e a variante `/?flow=recovery`. Exemplo local:

```text
http://localhost:5173/
http://localhost:5173/?flow=recovery
```

No Codespaces, use o endereço HTTPS encaminhado da porta 5173, no lugar de localhost. Se criar outro Codespace, atualize esses endereços. Não use o endereço do editor. Evite liberar redirecionamentos indiscriminadamente.

## 5. Execute e teste sua conta

```bash
npm run dev -- --host 0.0.0.0
```

Abra a porta indicada pelo terminal (normalmente 5173). Reinicie esse comando sempre que alterar `.env.local`.

Cadastre sua conta, confirme o e-mail e faça login. Salve uma nota e recarregue a página para verificar o banco. Teste também “Esqueci minha senha”. Faça um teste com uma segunda conta: ela deve iniciar sem as notas da primeira.

Para recuperar notas da versão anterior, entre na conta correta e use Configurações → importar backup JSON. A importação substitui os dados acadêmicos dessa conta após confirmação. Se os dados antigos estiverem no mesmo navegador e endereço, a opção de importar dados locais poderá encontrá-los. Não há importação automática, para evitar misturar pessoas no mesmo computador.

## 6. Publique na Vercel

1. Suba o projeto completo para o GitHub preservando `src/`, `supabase/` e `tests/`. Não envie `node_modules`, `dist` nem `.env.local`. Salvar no Codespaces não equivale a fazer commit e push no GitHub.
2. Na Vercel, importe o repositório. Se ele contém uma pasta externa, configure Root Directory para a pasta que contém `package.json`.
3. Selecione Vite, Node.js 22 ou superior, Build Command `npm run build` e Output Directory `dist`.
4. Em Environment Variables, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os mesmos valores públicos do seu projeto.
5. Faça o deploy. Ao mudar variáveis na Vercel, faça um novo deploy para reconstruir o aplicativo.
6. No Supabase, altere Site URL para seu domínio definitivo da Vercel. Adicione às Redirect URLs o domínio com `/` e com `/?flow=recovery`. Mantenha os endereços de desenvolvimento somente se ainda forem utilizados.
7. No endereço publicado, repita cadastro, confirmação, login, recuperação de senha, salvamento e teste de duas contas antes de divulgar.

## Regras desta versão

- Média base: `(parcial + bimestral) / 2`, ou nota direta informada antes dos ajustes.
- Paralela: a parcial seguinte pode melhorar a média anterior vermelha, sem diminuir a nota, até 6,0.
- Pontos extras: somados **depois** da paralela. Cada item tem nome e valor; pode ser editado ou removido. Exemplo: média 5,0 → paralela 6,0 → trabalho +1,0 → final 7,0. A nota final tem teto 10,0.
- Sem média base completa, os extras ficam cadastrados, mas não inventam uma nota final.
- Acompanhamento: escolha mínimo 22/11 ou objetivo 24/12. Essa escolha não muda a aprovação, que continua em 22 nas regulares e 11 nas técnicas.
- Ano letivo: 2026. Arredondamento para uma casa decimal.

## Salvamento e limitações

O aplicativo só confirma uma alteração depois da resposta do Supabase. Precisa de internet; não há fila offline. Se ocorrer erro, o formulário permanece disponível ou um aviso oferece baixar a tentativa em JSON. Não feche a aba antes de resolver ou baixar esse rascunho: ele não é persistido automaticamente.

Se outra aba ou aparelho salvar primeiro, o aplicativo detecta conflito e evita sobrescrever silenciosamente. Baixe a tentativa, recarregue e reaplique a alteração. Não há atualização em tempo real entre aparelhos: recarregue para buscar dados recentes. Mantenha backups JSON periódicos.

## Verificações incluídas

```bash
npm test
npm run build
```

Foram verificados cálculos, extras, migração de backups, metas e isolamento SQL em PostgreSQL embarcado, além da interface de login/cadastro em desktop e largura de celular e do fluxo de extras com dados fictícios. Login, entrega de e-mails e salvamento no **seu** Supabase exigem a configuração acima; o deploy real na Vercel também precisa ser feito.

## Documentação oficial

- [Autenticação por senha](https://supabase.com/docs/guides/auth/passwords)
- [URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls)
- [SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite)
