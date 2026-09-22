# Calendário Corre

Landing page do calendário de corridas de São Paulo.

Os eventos e locais ficam em uma única lista no primeiro `<script>` do `<head>` de `index.html`. Ao atualizar um evento, ajuste ali a data, o status e o link. Apenas eventos com status `ativo`, `aberto` ou `inscricoes_abertas` e data não vencida são publicados; os demais ficam ocultos automaticamente.

## Versões

- `index.html`: versão atual.
- Versões anteriores ficam no histórico do Git, não em cópias dentro do repositório:
  - tag `v1`: contém `v1/index.html` e os assets originais (PNGs e WebPs em alta).
  - tag `baseline-p1`: estado imediatamente antes da otimização de performance (P1).

Para consultar a v1 sem trocar de branch:

```bash
git show v1:v1/index.html > v1.html
```

## Imagens

Todas as imagens da página ficam em `assets/` em dois formatos: AVIF (principal) e WebP (fallback), servidos via `<picture>`.

| Uso | Arquivos | Larguras |
| --- | --- | --- |
| Banner | `banner-calendario-corre-<largura>` | 800, 1200, 1800, 2360 |
| Card largo e modal | `<local>-<largura>` (imagem inteira, 1560x680) | 800, 1200, 1560 |
| Cards comuns | `<local>-card-<largura>` (recorte central 3:2) | 520, 780, 1020 |

As variantes são geradas por `scripts/build-images.mjs` a partir das fontes em alta resolução, que estão preservadas na tag `baseline-p1` (instruções no topo do script).

Qualidade de compressão:

- Fotos dos locais (sem texto): AVIF q52 e WebP q75.
- Banner (texto verde sobre foto): AVIF q80 sem subamostragem de cor (4:4:4) e WebP q85. Com as configurações das fotos, as letras e o fundo ficavam visivelmente borrados.
- A arte do banner em 2360 px é uma ampliação do original de 1180 px, então tem uma maciez que nenhuma configuração de compressão corrige. Para um banner realmente nítido, exporte a arte novamente em 2360 px (idealmente com o texto vetorial) e regere com `node scripts/build-images.mjs <fontes> banner`.

## SEO e compartilhamento

Domínio canônico: `https://calendariodocorre.com.br/` (se houver `www`, redirecione para o domínio sem `www`).

| Item | Arquivo |
| --- | --- |
| Título, descrição, canônica, Open Graph e Twitter Card | `<head>` do `index.html` |
| Imagem das prévias de link (1200x630, JPEG) | `assets/social/calendario-do-corre-2026.jpg`, gerada por `scripts/build-social-image.mjs` a partir de `scripts/social-image.html` |
| Favicon | `favicon.svg` (fonte), `favicon.ico` e `apple-touch-icon.png` gerados por `scripts/build-icons.mjs` |
| Rastreamento | `robots.txt` e `sitemap.xml` na raiz (atualize o `lastmod` do sitemap quando o conteúdo mudar) |

Para regerar imagem social e ícones:

```bash
npm install --no-save sharp puppeteer-core
node scripts/build-icons.mjs
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" node scripts/build-social-image.mjs
```

Na virada de ano, atualize o ano em: `<title>`, `meta description`, `og:title`, texto do `<noscript>`, molde `scripts/social-image.html` e nome do arquivo da imagem social (no script e na `og:image`; o nome novo força WhatsApp e Facebook a buscarem a imagem de novo).

Depois de publicar, valide a prévia no [Sharing Debugger do Facebook](https://developers.facebook.com/tools/debug/) (também limpa o cache do WhatsApp) e envie o sitemap no Google Search Console.

## Fontes

DM Sans e Manrope são servidas localmente de `assets/fonts/` (woff2 variável, subconjunto latin), sem depender do Google Fonts. Origem: pacotes `@fontsource-variable/dm-sans` e `@fontsource-variable/manrope` 5.3.0, licença SIL Open Font License 1.1 (`assets/fonts/OFL-*.txt`).

## Acessibilidade

- O banner é o `h1` da página; o nome acessível vem do `alt` da imagem.
- Cada local é um `<button>` com `aria-label` no formato "N corridas Local", seguindo a ordem do texto visível, e `aria-haspopup="dialog"`. A foto do card é decorativa (`alt=""`).
- A imagem do primeiro card publicado recebe preload responsivo no `<head>`, além de `loading="eager"` e `fetchpriority="high"`; a seleção acompanha automaticamente os filtros de data e status. Os demais cards mantêm `loading="lazy"`.
- O modal usa `role="dialog"` e `aria-modal="true"`: o foco vai para o botão Fechar, Tab e Shift+Tab ficam presos no diálogo, Esc fecha e devolve o foco ao card, e o restante da página fica `inert` enquanto ele está aberto.
- Ao adicionar um local, preencha `imageAlt` descrevendo o que a foto mostra (é o texto alternativo da imagem do modal).
- Texto sobre fotos: a faixa escura de `.location-card-content` e o overlay do modal garantem contraste mínimo de 4,5:1 nos textos pequenos, inclusive em fotos claras.
- Sem JavaScript, um `<noscript>` explica o problema e aponta as plataformas de inscrição.
