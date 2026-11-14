# HemoRush

Jogo 3D (vista de cima) sobre compatibilidade sanguínea, com tema da Fundação Hemominas, criado por Danilo Cavalcante.
A personagem é a Ada, farmacêutica bioquímica da prova cruzada, inspirada na mãe do Danilo.
Ela pega bolsas de concentrado de hemácias no estoque e entrega aos transportadores, respeitando as regras reais dos sistemas ABO e Rh.

## Como trabalhar aqui

- Fale sempre em português. O Danilo é biólogo: o conteúdo científico já foi revisado por ele, não precisa insistir em revisão.
- Tudo fica em **um único arquivo**: `index.html`, com HTML, CSS e JS juntos. As artes são imagens em base64 dentro do arquivo, por isso ele é grande (~530 KB). Leia por trechos e procure pelos títulos das seções.
- Biblioteca externa: só o Three.js r128, via cdnjs. Sons e músicas são gerados em código (Web Audio), sem arquivos.
- Toda mudança precisa funcionar **no computador e no celular**.
- No celular o jogo é **sempre na horizontal**. Não existe versão em pé: com o celular em pé, aparece o aviso "Gire o celular".
- Telas de jogo têm que caber sem rolagem. Telas de texto (Sobre, tutorial) podem rolar.
- Comentários e nomes no código em português.

## Mapa do arquivo (procure por estes títulos)

- `CONFIGURAÇÃO`: todos os números de balanceamento (`CONFIG`), os níveis (`NIVEIS`: hemobaby, hemopleno, hemossauro, hemozen) e a lista `RANQUEADOS`.
- `SONS`: objeto `Som`, com efeitos ao vivo e trilhas pré-gravadas (`TRILHAS`: jogo, zen, menu).
- `REGRAS DE COMPATIBILIDADE`: `compativel(doador, receptor)`, `ANTIGENOS`, `nome()`.
- `CENA 3D`: sala, estoque, telefones, café, coletor, corredor do laboratório (`LAB`) e `texturaNitida()` para textos nítidos.
- `BOLSAS`: `criarBolsa`, `matRotulo` (etiqueta), `vagas`.
- `PERSONAGENS`: Ada e transportadores (caixa térmica como maleta).
- `ESTADO DO JOGO`, `AÇÕES` (pegar, entregar, `motivoIncompativel`), `PODERES` (Captação, Rede, Café), `HUD`.
- `FLUXO DE TELAS`: `abrirTela`, ranking local, modo evento, Opções.
- `ENTRADA`: teclado e joystick de toque. `LOOP`: `redimensionar`, `atualizar`.

## Regras do jogo que não podem mudar sem o Danilo pedir

- Pontuação: isogrupo +100, heterogrupo compatível +50, rapidez +20, erro ou tempo esgotado −1 crachá (5 crachás).
- O Hemozen não tem pressão, tem crachás infinitos e fica fora do ranking.
- Quando um pedido fica "sem saída", a reposição e a Rede ajudam discretamente (`pedidosSemSaida`), sem aviso nenhum.
- O ranking é local (`localStorage`), com top 10 por nível e nomes de até 10 caracteres.

## Teste

Abra o `index.html` no navegador. Para testar o celular, use o modo de dispositivo do Chrome (F12) com o aparelho deitado.
