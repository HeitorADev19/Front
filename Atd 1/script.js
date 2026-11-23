const inputItem = document.getElementById("input-item");
const formulario = document.querySelector("form");
const listaCompras = document.getElementById("lista-de-compras");

let contador = 2;

function verificarListaVazia() {
  const itens = listaCompras.querySelectorAll("li:not(.mensagem-lista-vazia)");
  const mensagemVazia = listaCompras.querySelector(".mensagem-lista-vazia");
  mensagemVazia.hidden = itens.length > 0;
}

listaCompras.addEventListener("change", (evento) => {
  if (evento.target.matches('input[type="checkbox"]')) {
    const nomeItem = evento.target
      .closest(".lista-item-container")
      .querySelector("p");
    nomeItem.classList.toggle("texto-riscado", evento.target.checked);
  }
});

listaCompras.addEventListener("click", (evento) => {
  const botaoRemover = evento.target.closest(".item-lista-button");
  if (!botaoRemover) {
    return;
  }

  botaoRemover.closest("li").remove();
  verificarListaVazia();
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const nome = inputItem.value.trim();
  if (nome === "") {
    alert("O campo nome não pode estar vazio!!!");
    return;
  }

  const itemLista = document.createElement("li");
  const conteinerItemLista = document.createElement("div");
  conteinerItemLista.classList.add("lista-item-container");
  const inputCheckbox = document.createElement("input");
  inputCheckbox.type = "checkbox";
  inputCheckbox.id = "checkbox-" + contador++;
  const nomeItem = document.createElement("p");
  nomeItem.innerText = nome;
  const botaoRemover = document.createElement("button");
  botaoRemover.type = "button";
  botaoRemover.classList.add("item-lista-button");
  botaoRemover.setAttribute("aria-label", `Remover ${nome}`);
  botaoRemover.innerText = "🗑";

  const data = new Date();
  const diaSemana = data.toLocaleDateString("pt-BR", { weekday: "long" });
  const dia = data.toLocaleDateString("pt-BR");
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const textoData = `${diaSemana} (${dia}) às ${hora}`;
  const paragrafoData = document.createElement("p");
  paragrafoData.classList.add("texto-data");
  paragrafoData.innerText = textoData;

  conteinerItemLista.appendChild(inputCheckbox);
  conteinerItemLista.appendChild(nomeItem);
  conteinerItemLista.appendChild(botaoRemover);
  itemLista.appendChild(conteinerItemLista);
  itemLista.appendChild(paragrafoData);
  listaCompras.appendChild(itemLista);
  inputItem.value = "";
  verificarListaVazia();
});

verificarListaVazia();