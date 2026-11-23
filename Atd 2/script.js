const formulario = document.getElementById("formularioCidade");
const campoCidade = document.getElementById("cidade");
const botaoConsultar = document.getElementById("botaoConsultar");
const painelStatus = document.getElementById("painelStatus");
const statusConsulta = document.getElementById("statusConsulta");
const mensagem = document.getElementById("mensagem");
const campoNomeCidade = document.getElementById("nomeCidade");
const campoLocalizacao = document.getElementById("localizacao");
const campoIconeClima = document.getElementById("iconeClima");
const campoTemperatura = document.getElementById("temperatura");
const campoDescricaoClima = document.getElementById("descricaoClima");
const campoAtualizacao = document.getElementById("atualizacao");
const campoSensacaoTermica = document.getElementById("sensacaoTermica");
const campoUmidade = document.getElementById("umidade");
const campoCodigoClima = document.getElementById("codigoClima");
const campoCoordenadas = document.getElementById("coordenadas");
const textoBotao = botaoConsultar.querySelector("span:last-child");
const painelResultado = document.querySelector(".resultado");

const descricoesClima = {
  0: "Céu limpo",
  1: "Predominantemente limpo",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Nevoeiro",
  48: "Nevoeiro com geada",
  51: "Garoa fraca",
  53: "Garoa moderada",
  55: "Garoa intensa",
  56: "Garoa congelante fraca",
  57: "Garoa congelante intensa",
  61: "Chuva fraca",
  63: "Chuva moderada",
  65: "Chuva intensa",
  66: "Chuva congelante fraca",
  67: "Chuva congelante intensa",
  71: "Neve fraca",
  73: "Neve moderada",
  75: "Neve intensa",
  77: "Grãos de neve",
  80: "Pancadas de chuva fracas",
  81: "Pancadas de chuva moderadas",
  82: "Pancadas de chuva violentas",
  85: "Pancadas de neve fracas",
  86: "Pancadas de neve intensas",
  95: "Trovoada",
  96: "Trovoada com granizo fraco",
  99: "Trovoada com granizo intenso",
};

function atualizarEstado(tipo, titulo, texto) {
  painelStatus.dataset.status = tipo;
  statusConsulta.textContent = titulo;
  mensagem.textContent = texto;
  painelResultado.setAttribute("aria-busy", String(tipo === "loading"));
}

function limparDados() {
  campoNomeCidade.textContent = "Sua cidade";
  campoLocalizacao.textContent = "Estado ou região · País";
  campoIconeClima.textContent = "☁";
  campoTemperatura.replaceChildren("—", document.createElement("span"));
  campoTemperatura.lastElementChild.textContent = "°C";
  campoDescricaoClima.textContent = "Aguardando dados";
  campoAtualizacao.textContent = "—";
  campoAtualizacao.removeAttribute("datetime");
  campoSensacaoTermica.textContent = "—";
  campoUmidade.textContent = "—";
  campoCodigoClima.textContent = "—";
  campoCoordenadas.textContent = "—";
}

async function obterCoordenadas(cidade) {
  const parametros = new URLSearchParams({
    name: cidade,
    count: "1",
    language: "pt",
    format: "json",
  });
  const resposta = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${parametros}`,
  );

  if (!resposta.ok) {
    throw new Error(
      `A busca da cidade falhou (HTTP ${resposta.status}). Tente novamente.`,
    );
  }

  const dados = await resposta.json();
  if (!Array.isArray(dados.results) || dados.results.length === 0) {
    throw new Error(
      `Não encontramos "${cidade}". Confira o nome da cidade e tente novamente.`,
    );
  }

  return dados.results[0];
}

async function obterClima(latitude, longitude) {
  const parametros = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code",
    timezone: "auto",
  });
  const resposta = await fetch(
    `https://api.open-meteo.com/v1/forecast?${parametros}`,
  );

  if (!resposta.ok) {
    throw new Error(
      `A consulta meteorológica falhou (HTTP ${resposta.status}). Tente novamente.`,
    );
  }

  const dados = await resposta.json();
  const atual = dados.current;
  const medidas = atual && [
    atual.temperature_2m,
    atual.apparent_temperature,
    atual.relative_humidity_2m,
    atual.weather_code,
  ];
  if (
    !atual ||
    !medidas.every((medida) => Number.isFinite(medida)) ||
    typeof atual.time !== "string"
  ) {
    throw new Error("A resposta da previsão está incompleta. Tente consultar novamente.");
  }

  return dados;
}

function obterIconeClima(codigo) {
  if (codigo === 0) {
    return "☀";
  }
  if (codigo === 1 || codigo === 2) {
    return "🌤";
  }
  if (codigo === 3) {
    return "☁";
  }
  if (codigo === 45 || codigo === 48) {
    return "🌫";
  }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(codigo)) {
    return "🌧";
  }
  if ([71, 73, 75, 77, 85, 86].includes(codigo)) {
    return "🌨";
  }
  return "⛈";
}

function exibirClima(local, clima) {
  const atual = clima.current;
  const localizacao = [local.admin1, local.country].filter(Boolean).join(", ");
  const hora = atual.time.replace("T", " ");
  const fuso = clima.timezone_abbreviation ? ` (${clima.timezone_abbreviation})` : "";

  campoNomeCidade.textContent = local.name;
  campoLocalizacao.textContent = localizacao || "Localização não informada";
  campoIconeClima.textContent = obterIconeClima(atual.weather_code);
  campoTemperatura.firstChild.textContent =
    `${Number(atual.temperature_2m).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })}`;
  campoDescricaoClima.textContent =
    descricoesClima[atual.weather_code] || "Condição meteorológica não identificada";
  campoAtualizacao.textContent = `${hora}${fuso}`;
  campoAtualizacao.dateTime = atual.time;
  campoSensacaoTermica.textContent =
    `${Number(atual.apparent_temperature).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} °C`;
  campoUmidade.textContent = `${atual.relative_humidity_2m}%`;
  campoCodigoClima.textContent = String(atual.weather_code);
  campoCoordenadas.textContent =
    `${Number(local.latitude).toFixed(2)}, ${Number(local.longitude).toFixed(2)}`;
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const cidade = campoCidade.value.trim();

  if (!cidade) {
    limparDados();
    atualizarEstado("error", "Cidade não informada", "Digite o nome de uma cidade para iniciar a consulta.");
    campoCidade.focus();
    return;
  }

  botaoConsultar.disabled = true;
  textoBotao.textContent = "Consultando...";
  limparDados();
  atualizarEstado("loading", "Consultando...", `Buscando as condições atuais para ${cidade}.`);

  try {
    const local = await obterCoordenadas(cidade);
    const clima = await obterClima(local.latitude, local.longitude);
    exibirClima(local, clima);
    atualizarEstado(
      "success",
      "Consulta concluída",
      `Dados atuais de ${local.name} carregados com sucesso.`,
    );
  } catch (erro) {
    const detalhe =
      erro instanceof Error ? erro.message : "Ocorreu um erro inesperado.";
    const mensagemErro =
      erro instanceof TypeError
        ? "Não foi possível acessar a Open-Meteo. Verifique sua conexão e tente novamente."
        : detalhe;
    atualizarEstado("error", "Não foi possível consultar", mensagemErro);
  } finally {
    botaoConsultar.disabled = false;
    textoBotao.textContent = "Consultar";
  }
});

campoCidade.value = "Fortaleza";
formulario.requestSubmit();

// Testes manuais: Fortaleza, Recife e Lisboa; erro reproduzido e tratado: cidade inexistente.
