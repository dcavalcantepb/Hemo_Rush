# HemoRush

[![CI](https://github.com/dcavalcantepb/Hemo_Rush/actions/workflows/ci.yml/badge.svg)](https://github.com/dcavalcantepb/Hemo_Rush/actions/workflows/ci.yml)

Jogo 3D, com vista de cima, sobre compatibilidade sanguínea ABO/Rh, com tema da Fundação Hemominas.

Você é a Ada, farmacêutica bioquímica da prova cruzada. Ela pega bolsas de concentrado de hemácias no estoque e as entrega aos transportadores antes que o tempo do pedido acabe, respeitando as regras reais de compatibilidade. Quando erra, o jogo explica o porquê ("Paciente O− tem anti-A e é Rh−: não recebe A+").

Funciona no computador (teclado) e no celular deitado (joystick de toque). Tem quatro níveis: Hemobaby, Hemopleno, Hemossauro e Hemozen, este último sem pressão.

## Rodar localmente

Requer Node.js 22 ou mais recente.

```bash
npm install
npm start          # http://127.0.0.1:8080
```

Também funciona com qualquer servidor estático na raiz do projeto. Abrindo o `index.html` direto pelo explorador de arquivos (`file://`), o jogo roda, mas o navegador bloqueia a fonte Lexend (o texto cai na fonte do sistema). Para testar a aparência real, use o servidor.

## Comandos

| Comando | Para quê |
| --- | --- |
| `npm start` | servidor local |
| `npm run lint` | ESLint |
| `npm test` | testes de unidade e integridade |
| `npm run test:e2e` | teste em navegador real, PC e celular (precisa de Chrome ou Edge) |
| `npm run verificar` | os três acima |
| `npm run pacote` | gera `dist/hemorush/`, só com os arquivos a publicar |
| `npm run icones` | regenera os ícones a partir de `assets/icons/icone.svg` |

## Documentação

- [Arquitetura](docs/ARQUITETURA.md): estrutura, ordem de carga dos scripts, decisões, performance e testes.
- [Segurança e publicação](docs/SEGURANCA-E-DEPLOY.md): riscos, requisitos do servidor, cache e checklist em aparelhos reais.
- [CLAUDE.md](CLAUDE.md): guia rápido para quem for mexer no código, incluindo regras do jogo que não podem mudar.

## Créditos e licenças

Criado por Danilo Cavalcante. Todos os direitos reservados.

Bibliotecas de terceiros incluídas:

- [Three.js](https://threejs.org/) r128, licença MIT ([vendor/three/LICENSE](vendor/three/LICENSE)).
- Fonte [Lexend](https://github.com/googlefonts/lexend), SIL Open Font License ([assets/fonts/OFL.txt](assets/fonts/OFL.txt)).
