# Segurança e publicação

Objetivo: publicar o HemoRush num link do site da Fundação Hemominas, jogável com a mesma qualidade em celular e computador.

## Antes de publicar: decisões que não são técnicas

1. **Autorização institucional.** O jogo usa o nome Hemominas e "Rede Hemominas" e simula um setor real. Publicar num site oficial exige o aval da instituição (comunicação e jurídico), inclusive sobre o texto educativo.
2. **Direitos de imagem.** `assets/img/ada-inspiracao.webp` é uma foto de pessoas reais. Para publicação ampla, é preciso o consentimento por escrito das pessoas retratadas. Também é preciso confirmar a origem e os direitos de uso de todas as artes.
3. **Licença.** O repositório não tem licença, então todos os direitos ficam reservados ao autor (`"license": "UNLICENSED"` no `package.json`). Antes de entregar o jogo a terceiros, defina se ele será cedido, licenciado ou aberto. As bibliotecas de terceiros já têm licença própria: Three.js (MIT, em `vendor/three/LICENSE`) e Lexend (OFL, em `assets/fonts/OFL.txt`). Esses avisos precisam ir junto com o jogo publicado, e o `npm run pacote` já os inclui.
4. **Repositório público.** O código, as artes e a foto ficam visíveis para qualquer pessoa no GitHub. Se algum desses itens não puder ser público, torne o repositório privado antes.

## Segurança

### O que já está resolvido

- **Sem servidor e sem coleta de dados.** O jogo não envia nada pela rede. Recordes, nomes do ranking (até 10 caracteres) e preferências ficam só no `localStorage` do aparelho. Nenhum dado pessoal sai do aparelho, o que simplifica muito a análise de LGPD.
- **Sem terceiros.** Three.js e a fonte são servidos pelo próprio site. Antes, a fonte vinha do Google Fonts, que recebe o IP de cada jogador. Um teste automático impede que um recurso externo volte sem querer.
- **Content Security Policy** (em `<meta>` no `index.html`): só scripts, fontes e imagens do próprio site. Não há `<script>` embutido nem `onclick=` no HTML, e um teste garante isso.
- **Injeção de HTML.** O único texto vindo do jogador, o nome no ranking, entra por `textContent`, nunca por `innerHTML`. Os `innerHTML` restantes usam só dados internos do jogo.
- **Link externo** ("Agende sua doação"): abre com `rel="noopener noreferrer"`.
- **Cadeia de dependências.** As dependências do npm são só ferramentas de desenvolvimento (ESLint e Puppeteer) e não vão para o site. O `package-lock.json` está versionado, o Dependabot propõe atualizações mensais, e o CI roda com permissão somente de leitura.

### Riscos e limitações conhecidos

- **O ranking é forjável.** Qualquer pessoa pode editar o `localStorage` pelas ferramentas do navegador. Isso não importa num ranking pessoal. Mas, se o **modo evento** for usado com premiação, os recordes não são confiáveis: um ranking com valor real precisaria de servidor e validação, o que é outro projeto.
- **A CSP em `<meta>` tem limites.** Ela não suporta `frame-ancestors` (proteção contra o jogo ser embutido em sites de terceiros). Configure a política também como cabeçalho HTTP (ver abaixo).
- **Three.js r128 (2021).** A versão é antiga, mas o risco é baixo, porque o jogo não carrega modelos nem texturas de fontes externas. Atualizar exige testar a cena inteira, e a API mudou entre versões. Não é urgente.
- **`style-src 'unsafe-inline'`.** Necessário porque o HTML usa atributos `style=`. O risco é baixo, já que não há injeção de HTML com dados do usuário. Dá para remover movendo esses estilos para o CSS.

## Publicação (deploy)

### Como gerar

1. O CI precisa estar verde no commit a publicar (lint, testes e teste em navegador).
2. Rode o **checklist em aparelhos reais**, logo abaixo.
3. Rode `npm run pacote`. Ele gera `dist/hemorush/` só com os arquivos públicos.
4. Marque a versão: `git tag v1.0.0 && git push --tags`.
5. Entregue `dist/hemorush/` à equipe que mantém o site.

### Requisitos do servidor

- **HTTPS obrigatório.** Tela cheia e trava de orientação no celular só funcionam em contexto seguro.
- **Subpasta funciona.** Todos os caminhos são relativos, então o jogo pode ficar em `https://site/hemorush/`.
- **Tipos MIME:** `.webmanifest` como `application/manifest+json` e `.woff2` como `font/woff2`. Servidores antigos podem não conhecer esses tipos.
- **Compressão gzip/brotli** para `.js`, `.css` e `.html`. O Three.js cai de ~600 KB para ~150 KB.
- **Cabeçalhos recomendados:**

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Cache: cuidado com atualizações

Os arquivos não têm versão no nome. Depois de uma atualização, um navegador pode misturar o `index.html` novo com um `js/` antigo guardado em cache. Isso quebra o jogo de formas difíceis de diagnosticar. Até haver um build com nomes versionados (ver [ARQUITETURA.md](ARQUITETURA.md)):

- `index.html`: `Cache-Control: no-cache`;
- `css/`, `js/`: `Cache-Control: max-age=3600`, no máximo;
- `assets/`, `vendor/`: podem ter cache longo, porque só mudam junto com o nome do arquivo.

### Link ou iframe?

**Recomendação: link para uma página própria do jogo, não iframe dentro de uma página do site.** Dentro de um iframe, o celular perde tela cheia e trava de orientação, a barra do navegador come espaço da tela deitada e o som pode ser bloqueado. Se o iframe for inevitável, ele precisa de `allow="fullscreen; autoplay"` e de `frame-ancestors` liberando o domínio do site.

### Checklist em aparelhos reais (antes de cada publicação)

O teste automático roda num navegador simulado e não mede desempenho nem toque de verdade.

- [ ] Android intermediário ou de entrada, no Chrome: abre, gira para horizontal, joystick, som, partida de 3 minutos sem travar.
- [ ] iPhone, no Safari: o mesmo, com atenção ao desbloqueio do som no primeiro toque e à área do notch.
- [ ] PC, no Chrome, Edge e Firefox: teclado, som, redimensionar a janela.
- [ ] Celular em pé: aparece o aviso "Gire o celular".
- [ ] Ranking: salvar nome, recarregar a página e conferir que o recorde ficou.
- [ ] Rede lenta (3G simulado no DevTools): o jogo abre em tempo aceitável.

## Próximos passos recomendados (não feitos)

- **Qualidade adaptativa:** medir os quadros por segundo durante a partida e reduzir a resolução em aparelhos fracos. É a técnica padrão para garantir fluidez em celulares de entrada, mas precisa de teste em aparelho real antes de ser ativada.
- **Funcionamento offline (service worker):** permitiria jogar sem rede depois da primeira visita. Também aumenta o risco de cache desatualizado, então só vale junto com um build com nomes versionados.
