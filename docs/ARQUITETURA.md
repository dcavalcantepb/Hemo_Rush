# Arquitetura

O HemoRush é um site estático: HTML, CSS e JavaScript puros, sem etapa de build e sem servidor. A cena 3D usa o Three.js (r128). Os sons e as músicas são gerados em código com a Web Audio API, sem arquivos de áudio.

## Estrutura

```
index.html              marcação das telas e ordem de carga dos scripts
css/style.css           todo o visual (layout de PC e de celular deitado)
js/                     o jogo, em scripts clássicos (ver "Ordem de carga")
  config.js             números de balanceamento (CONFIG) e níveis (NIVEIS)
  som.js                efeitos e trilhas sintetizados (objeto Som)
  regras.js             compatibilidade ABO/Rh (arquivo puro, testado no Node)
  cena.js               sala, laboratório, telefones, café e descarte em 3D
  bolsas.js             modelo das bolsas e vagas do estoque
  personagens.js        Ada e transportadores
  interface.js          balões, textos flutuantes e tabela de compatibilidade
  estado.js             estado da partida, reposição e chegada de pacientes
  acoes.js              pegar, trocar, entregar, perder crachá
  poderes.js            Captação!, Rede Hemominas, Café e descarte
  hud.js                placar, crachás e dica contextual
  telas.js              fluxo de telas, ranking local, modo evento, opções
  entrada.js            teclado e joystick de toque
  loop.js               redimensionamento, atualização por quadro e partida inicial
assets/img/             artes (WebP)
assets/fonts/           fonte Lexend (OFL), servida pelo próprio site
assets/icons/           ícone-fonte (SVG) e ícones gerados (PNG)
vendor/three/           Three.js r128 (MIT), cópia exata do arquivo oficial
scripts/                servidor local, empacotamento e geração de ícones
tests/                  testes de unidade e integridade (Node) e teste em navegador
```

## Ordem de carga e escopo global

Os arquivos de `js/` são **scripts clássicos com `defer`**, não módulos ES. Eles rodam na ordem em que aparecem no `index.html` e compartilham o mesmo escopo global, exatamente como quando o jogo era um único `<script>`.

**Regra importante:** em scripts separados, uma função declarada (`function x() {}`) só existe depois que o arquivo dela foi carregado. Código que **roda na carga** de um arquivo, fora de funções, não pode chamar funções de arquivos que vêm **depois**. Chamadas dentro de funções podem, porque as funções só rodam quando o jogo já carregou tudo. Por exemplo, `poderes` é declarado em `estado.js` e inicializado em `poderes.js`, onde ficam as funções que o montam.

O ESLint entende esse arranjo: cada arquivo recebe como globais os nomes declarados pelos outros (`eslint.config.js`). Um nome digitado errado entre arquivos vira erro de lint.

### Por que não módulos ES

Foi uma escolha consciente para este tamanho de projeto:

- **Sem build:** o jogo abre de qualquer servidor estático e o código publicado é o mesmo do repositório.
- **Estado compartilhado:** `estado`, `jogo` e `poderes` são reatribuídos por vários arquivos. Em módulos ES, os imports são somente leitura, então seria preciso reorganizar esse estado num objeto central. É uma refatoração grande, sem ganho para o jogador.

**Quando migrar:** se o jogo crescer bastante, se mais pessoas forem programar nele ou se for necessário cache por nome de arquivo com hash (ver [SEGURANCA-E-DEPLOY.md](SEGURANCA-E-DEPLOY.md)). O caminho é este:

1. Reunir o estado mutável num objeto `estadoJogo`.
2. Converter os arquivos para `import`/`export`.
3. Adotar o Vite para gerar `dist/` com nomes versionados.

Os testes atuais continuam valendo como rede de segurança.

## Performance

- **Qualidade adaptativa** (`js/qualidade.js`): durante o plantão, mede os fps em janelas de 2 s. Abaixo de 40 fps por uma janela inteira, baixa um nível (Alta → Média → Baixa → Mínima: resolução 2× → 1,5× → 1,25× → 1× e mapa de sombra 1024 → 1024 → 512 → 256; a sombra nunca é desligada, porque isso recompila todos os shaders e congela o jogo por centenas de ms). Espera 4 s para o jogo assentar após cada troca, descarta janelas com soluço (quadro > 300 ms, como troca de aba ou compilação de shader) e só sobe depois de 15 s seguidos a pelo menos 90% do alvo do aparelho. Um nível que travou não é tentado de novo na sessão, para não oscilar. O último nível fica no `localStorage`. Em Opções, "Gráficos" permite travar um nível; `?debug` na URL mostra um medidor (fps, nível, taxa da tela, alvo).
- **Quadros por segundo no celular:** limitados a 60 (`INTERVALO_MIN_MS` em `loop.js`). Telas de 90/120 Hz desenhariam 1,5×/2× mais, sem ganho visível e com o aparelho esquentando na mesma proporção. Em 120 Hz o jogo roda a 60; em 90 Hz, a 45. No PC não há limite. Pelo mesmo motivo, o pedido de GPU "high-performance" é só para PC.
- **Resolução:** limitada a 2× a densidade da tela. O antialias só liga em telas 1×, porque em telas 2× é redundante e caro.
- **Sombras:** mapa de 1024 px e filtro PCF simples no celular; 2048 px e PCF suave no PC.
- **Textos 3D:** os textos das bolsas e placas são reduzidos para o tamanho em que aparecem (`texturaNitida`), para ficarem nítidos sem texturas gigantes.
- **Fora da partida:** a cena desenha em meio ritmo e não é desenhada quando uma tela própria a cobre.
- **HUD:** só escreve no DOM quando o valor muda (`escrever`), em vez de a cada quadro.
- **Recursos:** tudo servido do mesmo domínio, sem conexões a terceiros. A fonte é variável: um arquivo cobre todos os pesos.

## Testes

| Comando | O que verifica |
| --- | --- |
| `npm run lint` | ESLint, inclusive nomes entre arquivos |
| `npm test` | Regras ABO/Rh contra uma tabela de referência escrita à mão; coerência do `CONFIG` e dos níveis; integridade (ids, arquivos referenciados, CSP, nada externo, hash do Three.js) |
| `npm run test:e2e` | Abre o jogo no Chrome headless como PC e como celular deitado, inicia uma partida e falha em qualquer erro de console, rede ou CSP |

O teste em navegador garante que o jogo sobe e roda. Ele **não substitui** o teste em aparelhos reais (ver checklist em [SEGURANCA-E-DEPLOY.md](SEGURANCA-E-DEPLOY.md)).
