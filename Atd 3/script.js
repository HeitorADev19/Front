const cidadeBuscada = document.getElementById("cidade");
const botaoBuscar = document.getElementById("botao");
const formulario = document.getElementById("consultaClima");

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const cidade = cidadeBuscada.value.trim();
  if (!cidade) return;

  botaoBuscar.disabled = true;
  try {
    const local = await obterCoordenadas(cidade);
    const latitude = local.latitude;
    const longitude = local.longitude;
    const clima = await obterClima(latitude, longitude);

    console.log("Local encontrado:", local);
    console.log("Condições atuais:", clima.current);
    console.log(`Latitude: ${latitude}, longitude: ${longitude}`);
    console.log(`Temperatura: ${clima.current.temperature_2m} °C`);
    console.log(`Sensação térmica: ${clima.current.apparent_temperature} °C`);

    // TODO (atividade): atualizar os elementos da página com DOM:
    // nomeCidade, localizacao, temperatura, descricaoClima,
    // atualizacao, sensacaoTermica, umidade, codigoClima,
    // coordenadas, statusConsulta e mensagem.
    // Consulte clima.current.weather_code e o dicionário da API.
  } catch (erro) {
    console.error("Falha na consulta:", erro.message);
    // TODO (atividade): apresentar uma mensagem de erro ao usuário.
  } finally {
    botaoBuscar.disabled = false;
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
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code",
    timezone: "auto"
  });
  const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${parametros}`);
  if (!resp.ok) throw new Error(`Erro HTTP na consulta do clima: ${resp.status}`);
  const data = await resp.json();
  if (!data.current) throw new Error("A API não retornou as condições atuais.");
  return data;
}
