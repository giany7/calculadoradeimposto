const TAX_RATE = 0.076;
const EXCHANGE_RATE_URL = "https://economia.awesomeapi.com.br/json/last/USD-BRL";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const incomeInput = document.querySelector("#income-usd");
const exchangeRateLabel = document.querySelector("#exchange-rate");
const rateUpdatedLabel = document.querySelector("#rate-updated");
const refreshButton = document.querySelector("#refresh-rate");
const taxTotalLabel = document.querySelector("#tax-total span");
const grossLabel = document.querySelector("#gross-brl");
const netLabel = document.querySelector("#net-brl");
const calculateButton = document.querySelector("#calculate-button");

let exchangeRate = null;
let lastUpdatedAt = null;

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const usd = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "USD",
});

function showRateError(message) {
  exchangeRateLabel.textContent = "Cotação indisponível";
  rateUpdatedLabel.textContent = message;
  exchangeRateLabel.setAttribute("aria-label", "Não foi possível obter a cotação atual.");
}

function formatUpdatedAt(date) {
  return `Atualizada às ${new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)} · USD / BRL`;
}

async function updateExchangeRate() {
  refreshButton.disabled = true;
  refreshButton.classList.add("is-loading");
  refreshButton.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(EXCHANGE_RATE_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`O serviço de cotação respondeu com status ${response.status}.`);
    }

    const data = await response.json();
    const rate = Number(data?.USDBRL?.bid);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("O serviço de cotação retornou um valor inválido.");
    }

    exchangeRate = rate;
    lastUpdatedAt = new Date();
    exchangeRateLabel.textContent = `${brl.format(rate)} por US$ 1`;
    rateUpdatedLabel.textContent = formatUpdatedAt(lastUpdatedAt);
    exchangeRateLabel.removeAttribute("aria-label");
    calculateEstimate();
  } catch (error) {
    exchangeRate = null;
    lastUpdatedAt = null;
    showRateError("Confira sua conexão e tente novamente.");
    calculateEstimate();
    console.error("Não foi possível atualizar a cotação USD/BRL:", error);
  } finally {
    refreshButton.disabled = false;
    refreshButton.classList.remove("is-loading");
    refreshButton.removeAttribute("aria-busy");
  }
}

function calculateEstimate() {
  const income = Number(incomeInput.value);
  const hasIncome = incomeInput.value.trim() !== "" && Number.isFinite(income) && income >= 0;

  if (!hasIncome) {
    taxTotalLabel.textContent = "0,00";
    grossLabel.textContent = brl.format(0);
    netLabel.textContent = brl.format(0);
    incomeInput.setAttribute("aria-invalid", incomeInput.value.trim() !== "" ? "true" : "false");
    return;
  }

  incomeInput.removeAttribute("aria-invalid");
  if (exchangeRate === null) {
    showRateError("Atualize a cotação para calcular.");
    return;
  }

  const gross = income * exchangeRate;
  const tax = gross * TAX_RATE;
  taxTotalLabel.textContent = brl.format(tax).replace(/^R\$\s?/, "");
  grossLabel.textContent = brl.format(gross);
  netLabel.textContent = brl.format(gross - tax);
}

function setCurrentMonth() {
  const now = new Date();
  document.querySelector("#current-month").textContent = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(now).toLocaleUpperCase("pt-BR");
  document.querySelector("#current-year").textContent = now.getFullYear();
}

refreshButton.addEventListener("click", updateExchangeRate);
calculateButton.addEventListener("click", calculateEstimate);
incomeInput.addEventListener("input", calculateEstimate);
incomeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") calculateEstimate();
});

setCurrentMonth();
updateExchangeRate();
window.setInterval(updateExchangeRate, REFRESH_INTERVAL_MS);