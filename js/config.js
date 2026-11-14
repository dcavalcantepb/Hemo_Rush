// =====================================================================
// CONFIGURAÇÃO — todos os números de balanceamento ficam aqui.
// =====================================================================
const CONFIG = {
  estoqueCapacidade: 20,
  estoqueInicial: 8,
  reposicaoIntervalo: 6,            // segundos entre bolsas novas no início
  reposicaoAumentoPorNivel: 0.3,    // a reposição fica mais lenta a cada nível
  reposicaoIntervaloMax: 9,
  pontosIso: 100,
  pontosHetero: 50,
  crachas: 5,
  pontosPorNivel: 600,              // a pressão sobe a cada X pontos
  contadorInicial: 30,              // segundos do balão no início
  contadorReducaoPorNivel: 2,
  contadorMinimo: 14,
  transportadoresInicio: 2,
  transportadoresMax: 5,
  niveisPorTransportadorExtra: 2,
  chegadaIntervaloInicial: 6,
  chegadaReducaoPorNivel: 0.6,
  chegadaIntervaloMinimo: 2.5,
  rhNegativoAumentoPorNivel: 0.25,  // pedidos Rh− ficam mais comuns com a pressão
  velocidadeAda: 7,
  bonusRapidez: 20,                 // pontos extras por entregar rápido
  bonusRapidezFracao: 0.5,          // vale se sobrar mais que esta fração do tempo do pedido
  dicaCompatibilidade: false,       // balões dos pacientes compatíveis brilham (só no Hemobaby)
  zen: false,                       // Hemozen: sem pressão, sem perder crachá e fora do ranking
  alcanceTransportador: 2.8,
  captacaoBolsas: 3,                // Captação!: quantas bolsas O− chegam
  captacaoTempoChegada: 10,         // segundos até chegarem
  captacaoRecarga: 120,             // segundos até poder convocar de novo
  redeTiposDisponiveis: 4,          // Rede Hemominas: quantos tipos a rede tem a cada ligação
  redeMaxPorTipo: 3,                // bolsas por tipo (sorteado de 1 até este número)
  redeTempoChegada: 8,
  redeRecarga: 45,
  redeAtualiza: 20,                 // a cada 20 s o estoque das outras unidades muda
  cafeDuracao: 30,                  // Café: segundos de Ada acelerada
  cafeMultiplicador: 1.6,           // quanto mais rápido ela anda
  cafeRecarga: 60,                  // conta a partir do momento em que ela toma o café
  poderesComecamRecarregando: true, // telefones e café começam o plantão em recarga
  recargaInicialTelefones: 10,      // no começo do plantão os dois telefones liberam em 10 s (o café em cafeRecarga)
  // Distribuição aproximada dos tipos no Brasil (%). Trocar pelos dados da Hemominas.
  proporcoes: { "O+": 36, "A+": 34, "B+": 8, "AB+": 2.5, "O-": 9, "A-": 8, "B-": 2, "AB-": 0.5 }
};

// Níveis de dificuldade: cada um troca só os números que mudam; o resto vem do CONFIG acima (Hemopleno).
const NIVEIS = {
  hemobaby: {
    nome: "Hemobaby",
    contadorInicial: 90, contadorReducaoPorNivel: 5, contadorMinimo: 45,
    // transportadores chegam no ritmo normal; o que muda é o tempo longo de espera
    transportadoresMax: 3, niveisPorTransportadorExtra: 3,
    pontosPorNivel: 700, estoqueInicial: 10,
    reposicaoIntervalo: 6, reposicaoAumentoPorNivel: 0.25, reposicaoIntervaloMax: 8,
    rhNegativoAumentoPorNivel: 0.15,
    bonusRapidez: 20,
    dicaCompatibilidade: true,
    poderesComecamRecarregando: false,
    // depois de 5.000 pontos o Hemobaby "cresce": o plantão aperta de verdade
    virada: {
      pontos: 5000,
      aviso: "O Hemobaby cresceu! O plantão vai apertar",
      ajustes: {
        contadorMinimo: 28, contadorReducaoPorNivel: 6,
        transportadoresMax: 4, niveisPorTransportadorExtra: 2,
        reposicaoAumentoPorNivel: 0.35, reposicaoIntervaloMax: 9.5,
        rhNegativoAumentoPorNivel: 0.3, bonusRapidezFracao: 0.6
      }
    }
  },
  hemopleno: { nome: "Hemopleno" },
  hemossauro: {
    nome: "Hemossauro",
    contadorInicial: 22, contadorReducaoPorNivel: 2, contadorMinimo: 10,
    chegadaIntervaloInicial: 4.5, chegadaReducaoPorNivel: 0.5, chegadaIntervaloMinimo: 1.8,
    transportadoresInicio: 3, transportadoresMax: 5, niveisPorTransportadorExtra: 1,
    pontosPorNivel: 500, estoqueInicial: 6,
    reposicaoIntervalo: 7, reposicaoAumentoPorNivel: 0.35, reposicaoIntervaloMax: 10,
    rhNegativoAumentoPorNivel: 0.35
  },
  // Hemozen: para passar o tempo. A pressão nunca sobe (fica sempre no começo), erro não custa crachá
  // e a partida só acaba quando o jogador encerra. Fica fora do ranking.
  hemozen: {
    nome: "Hemozen",
    zen: true,
    pontosPorNivel: 1e12,
    contadorInicial: 40,
    transportadoresInicio: 3, transportadoresMax: 3,
    chegadaIntervaloInicial: 6,
    estoqueInicial: 10, reposicaoIntervalo: 5.5,
    captacaoRecarga: 60, redeRecarga: 25, cafeRecarga: 40,
    poderesComecamRecarregando: false
  }
};
// Níveis que têm ranking (o Hemozen não entra)
const RANQUEADOS = ["hemobaby", "hemopleno", "hemossauro"];
const CONFIG_BASE = JSON.parse(JSON.stringify(CONFIG));
