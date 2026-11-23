const cidadeBuscada = document.getElementById("cidade");
const botaoBuscar = document.getElementById("botao");
const formulario = document.getElementById("consultaClima");
const nomeCidade = document.getElementById("nomeCidade");
const localizacao = document.getElementById("localizacao");
const temperatura = document.getElementById("temperatura");
const descricaoClima = document.getElementById("descricaoClima");
const atualizacao = document.getElementById("atualizacao");
const sensacaoTermica = document.getElementById("sensacaoTermica");
const umidade = document.getElementById("umidade");
const codigoClima = document.getElementById("codigoClima");
const coordenadas = document.getElementById("coordenadas");
const statusConsulta = document.getElementById("statusConsulta");
const mensagem = document.getElementById("mensagem");

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

function atualizarEstado(status, titulo, texto) {
  statusConsulta.dataset.status = status;
  statusConsulta.textContent = titulo;
  mensagem.textContent = texto;
}

function limparResultado() {
  nomeCidade.textContent = "Sua próxima consulta";
  localizacao.textContent = "Cidade e país aparecerão aqui";
  temperatura.textContent = "--";
  descricaoClima.textContent = "Consulte uma cidade para ver o clima";
  atualizacao.textContent = "Horário da observação: --";
  sensacaoTermica.textContent = "-- °C";
  umidade.textContent = "-- %";
  codigoClima.textContent = "--";
  coordenadas.textContent = "--, --";
}

function exibirCondicoes(local, clima) {
  const atual = clima.current;
  const regiao = [local.admin1, local.country].filter(Boolean).join(", ");
  const horario = atual.time.replace("T", " ");
  const fuso = clima.timezone_abbreviation
    ? ` (${clima.timezone_abbreviation})`
    : "";
  const formatarNumero = (valor) =>
    Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  nomeCidade.textContent = local.name;
  localizacao.textContent = regiao || "Localização não informada";
  temperatura.textContent = formatarNumero(atual.temperature_2m);
  descricaoClima.textContent =
    descricoesClima[atual.weather_code] ||
    "Condição meteorológica não identificada";
  atualizacao.textContent = `Horário da observação: ${horario}${fuso}`;
  sensacaoTermica.textContent = `${formatarNumero(
    atual.apparent_temperature,
  )} °C`;
  umidade.textContent = `${atual.relative_humidity_2m} %`;
  codigoClima.textContent = String(atual.weather_code);
  coordenadas.textContent =
    `${Number(local.latitude).toFixed(2)}, ${Number(local.longitude).toFixed(2)}`;
}

cidadeBuscada.addEventListener("invalid", () => {
  atualizarEstado(
    "error",
    "Cidade não informada",
    "Digite o nome de uma cidade para consultar as condições atuais.",
  );
});

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const cidade = cidadeBuscada.value.trim();

  if (!cidade) {
    atualizarEstado(
      "error",
      "Cidade não informada",
      "Digite o nome de uma cidade para consultar as condições atuais.",
    );
    cidadeBuscada.focus();
    return;
  }

  limparResultado();
  atualizarEstado(
    "loading",
    "Consultando...",
    `Buscando as condições atuais para ${cidade}.`,
  );
  botaoBuscar.disabled = true;
  botaoBuscar.firstChild.textContent = "Consultando clima ";

  try {
    const local = await obterCoordenadas(cidade);
    const latitude = local.latitude;
    const longitude = local.longitude;
    const clima = await obterClima(latitude, longitude);

    exibirCondicoes(local, clima);
    atualizarEstado(
      "success",
      "Consulta concluída",
      `Condições atuais de ${local.name} carregadas com sucesso.`,
    );

    console.log("Local encontrado:", local);
    console.log("Condições atuais:", clima.current);
    console.log(`Latitude: ${latitude}, longitude: ${longitude}`);
    console.log(`Temperatura: ${clima.current.temperature_2m} °C`);
    console.log(`Sensação térmica: ${clima.current.apparent_temperature} °C`);
  } catch (erro) {
    console.error("Falha na consulta:", erro.message);
    const textoErro =
      erro instanceof TypeError
        ? "Não foi possível acessar a Open-Meteo. Verifique sua conexão e tente novamente."
        : erro.message;
    atualizarEstado("error", "Não foi possível consultar", textoErro);
  } finally {
    botaoBuscar.disabled = false;
    botaoBuscar.firstChild.textContent = "Consultar clima ";
  }
});

async function obterCoordenadas(cidade) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Erro HTTP na busca da cidade: ${resp.status}`);
  const data = await resp.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("Cidade não encontrada. Confira o nome e tente novamente.");
  }
  return data.results[0];
}

async function obterClima(latitude, longitude) {
  const parametros = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code",
    timezone: "auto",
  });
  const resp = await fetch(
    `https://api.open-meteo.com/v1/forecast?${parametros}`,
  );
  if (!resp.ok) throw new Error(`Erro HTTP na consulta do clima: ${resp.status}`);
  const data = await resp.json();
  if (!data.current) {
    throw new Error("A API não retornou as condições atuais.");
  }
  return data;
}

// Testes manuais: Fortaleza, Recife e Lisboa; erro reproduzido e tratado: cidade inexistente.
