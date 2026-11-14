# HemoRush

Jogo 3D (vista de cima) sobre compatibilidade sanguínea, com tema da Fundação Hemominas, criado por Danilo Cavalcante.
A personagem é a Ada, farmacêutica bioquímica da prova cruzada, inspirada na mãe do Danilo.
Ela pega bolsas de concentrado de hemácias no estoque e entrega aos transportadores, respeitando as regras reais dos sistemas ABO e Rh.
Objetivo: um dia ser publicado num link do site da Hemominas, com a mesma qualidade no celular e no computador.

## Como trabalhar aqui

- Fale sempre em português. O Danilo é biólogo: o conteúdo científico já foi revisado por ele, não precisa insistir em revisão.
- Site estático, sem build: `index.html` (marcação), `css/style.css`, `js/*.js`. Estrutura completa e decisões em `docs/ARQUITETURA.md`.
- Os arquivos de `js/` são **scripts clássicos com `defer`**, que compartilham o escopo global e rodam na ordem do `index.html`. Código que roda na carga de um arquivo (fora de funções) **não pode chamar função de arquivo posterior**: ela ainda não existe. Arquivo novo em `js/` precisa entrar no `index.html`, e um teste cobra isso.
- Nada externo: Three.js r128 em `vendor/three/`, fonte Lexend em `assets/fonts/`, artes em `assets/img/`. A CSP do `index.html` só permite o próprio site: nada de `<script>` embutido, `onclick=` ou CDN. Sons e músicas são gerados em código (Web Audio), sem arquivos.
- Texto vindo do jogador (nome no ranking) entra por `textContent`, nunca por `innerHTML`.
- Toda mudança precisa funcionar **no computador e no celular**.
- No celular o jogo é **sempre na horizontal**. Não existe versão em pé: com o celular em pé, aparece o aviso "Gire o celular".
- Telas de jogo têm que caber sem rolagem. Telas de texto (Sobre, tutorial) podem rolar.
- Comentários e nomes no código em português.
- Repositório: local em `23-Hemo_Rush`, espelhado em https://github.com/dcavalcantepb/Hemo_Rush (público). O CI do GitHub roda lint, testes e teste em navegador a cada push.

## Mapa do código

- `js/config.js`: todos os números de balanceamento (`CONFIG`), os níveis (`NIVEIS`: hemobaby, hemopleno, hemossauro, hemozen) e a lista `RANQUEADOS`.
- `js/som.js`: objeto `Som`, com efeitos ao vivo e trilhas pré-gravadas (`TRILHAS`: jogo, zen, menu).
- `js/regras.js`: `compativel(doador, receptor)`, `ANTIGENOS`, `nome()`, `motivoIncompativel()`, `sortear()`. Arquivo puro, testado no Node.
- `js/cena.js`: sala, estoque, telefones, café, coletor, corredor do laboratório (`LAB`) e `texturaNitida()` para textos nítidos.
- `js/bolsas.js`: `criarBolsa`, `matRotulo` (etiqueta), `vagas`. `js/personagens.js`: Ada e transportadores (caixa térmica como maleta).
- `js/interface.js`: `$`, balões, `flutuar`, tabela de compatibilidade. `js/estado.js`: `jogo`, `estado`, `poderes`, reposição, `pedidosSemSaida`.
- `js/acoes.js`: pegar, entregar, perder crachá. `js/poderes.js`: Captação, Rede, Café, descarte. `js/hud.js`: placar e dica.
- `js/telas.js`: `abrirTela`, ranking local, modo evento, Opções, `ARTE_NIVEIS`. `js/entrada.js`: teclado e joystick. `js/loop.js`: `redimensionar`, `atualizar`, partida inicial.

## Regras do jogo que não podem mudar sem o Danilo pedir

- Pontuação: isogrupo +100, heterogrupo compatível +50, rapidez +20, erro ou tempo esgotado −1 crachá (5 crachás). Há teste cobrando esses valores.
- O Hemozen não tem pressão, tem crachás infinitos e fica fora do ranking.
- Quando um pedido fica "sem saída", a reposição e a Rede ajudam discretamente (`pedidosSemSaida`), sem aviso nenhum.
- O ranking é local (`localStorage`), com top 10 por nível e nomes de até 10 caracteres.

## Teste

- `npm run verificar` antes de cada commit: lint, testes de unidade e integridade, e o teste em Chrome headless como PC e celular deitado. As capturas de tela ficam em `tests/saida/`.
- Para ver o jogo, use `npm start` (http://127.0.0.1:8080). Para o celular, use o modo de dispositivo do Chrome (F12) com o aparelho deitado. Antes de publicar, siga o checklist em aparelhos reais de `docs/SEGURANCA-E-DEPLOY.md`.
