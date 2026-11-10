# Precificação Mosaic

Ferramenta de precificação de imóveis para os corretores da Mosaic Homes.

- `index.html`: a ferramenta (funciona sem login; só o Claude pede a senha).
- `api/analisar.js`: chama o Claude com a chave da Mosaic.
- `api/entrar.js`: confere a senha do time.

Variáveis na Vercel:
- `SITE_PASSWORD` (obrigatória): senha que os corretores usam para o Claude.
- `ANTHROPIC_API_KEY` (obrigatória): chave da Anthropic, com escopo de espaço de trabalho.
- `ANTHROPIC_MODEL` (opcional): modelo usado. Padrão: claude-sonnet-5-5.
- `ANTHROPIC_WORKSPACE_ID` (opcional): só se a chave não tiver escopo de espaço de trabalho.
