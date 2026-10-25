# Conectar o Chá Missionário ao Supabase

## 1. Criar as tabelas e permissões
1. Abra o projeto no Supabase e entre em **SQL Editor**.
2. Abra o arquivo `supabase-setup.sql` deste ZIP, copie todo o conteúdo e cole no SQL Editor.
3. Clique em **Run**. O resultado esperado é `Success. No rows returned`.

## 2. Colocar os dados públicos do projeto
1. No Supabase, copie o **Project URL** e a **Publishable key**.
2. Abra `js/supabase-config.js`.
3. Substitua `COLE_AQUI_A_PROJECT_URL` pela URL e `COLE_AQUI_A_PUBLISHABLE_KEY` pela Publishable key, mantendo as aspas.
4. Use somente a Publishable key. Nunca coloque uma chave `secret` ou `service_role` no site.

Exemplo ilustrativo (não use esses valores):
```js
export const SUPABASE_URL = "https://seu-projeto.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sua-chave";
```

## 3. Publicar no GitHub Pages
1. Descompacte este ZIP no computador.
2. Entre na pasta `cha-missionario` e envie o conteúdo dela para a raiz (`/`) do repositório GitHub, na branch `main`, substituindo os arquivos antigos.
3. Confirme que `index.html` está na raiz do repositório, não dentro de outra pasta.
4. Aguarde o GitHub Pages atualizar e teste a página de doações e o mural de recados em uma janela anônima ou em outro celular.

## Notas
- A página consulta os contadores a cada 5 segundos e o mural a cada 10 segundos.
- O Supabase armazena dados compartilhados entre dispositivos. Antes de divulgar o link, faça um teste de envio.
- O mural é público e aceita mensagens de visitantes. As políticas limitam tamanho e permitem apenas leitura/envio; ainda assim, qualquer site público pode receber spam. Revise os recados periodicamente.
- Este projeto não usa Firebase para essas funções após a configuração do Supabase. `js/firebase-config.js` e `firestore.rules` antigos ficam no ZIP apenas como arquivos legados; não são usados pelo novo `store.js`.
