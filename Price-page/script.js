let language = "en";
let crops = {};
let currentChart = null;

async function loadData() {
  const file = `data/crop_prices_${language}.json`;
  const res = await fetch(file);
  crops = await res.json();
  displayCropList();
  document.getElementById("langToggle").textContent = language === "en" ? "हिंदी" : "English";
}

function toggleLanguage() {
  language = language === "en" ? "hi" : "en";
  loadData();
}

function displayCropList(filter = "") {
  const cropList = document.getElementById("cropList");
  cropList.classList.remove("hidden");
  document.getElementById("analysisSection").classList.add("hidden");
  cropList.innerHTML = "";

  Object.entries(crops).forEach(([key, crop]) => {
    const cropName = language === "en" ? key : crop.name_hi || key;
    if (cropName.toLowerCase().includes(filter.toLowerCase())) {
      const row = document.createElement("div");
      row.className = "crop-card";
      row.innerHTML = `
        <h3>${cropName}</h3>
        <p>₹${crop.current_price} / quintal</p>
        <button id="anal" onclick="showAnalysis('${key}')">${language === "en" ? "Analyse" : "विश्लेषण करें"}</button>
      `;
      cropList.appendChild(row);
    }
  });
}
function showAnalysis(cropKey) {
  const crop = crops[cropKey];
  const cropName = language === "en" ? cropKey : crop.name_hi;

  // ── 1) pick price label per language ────────────────────────────
  const priceLabel =
    language === "en"
      ? "Current Price"
      : "वर्तमान कीमत";

  // ── 2) fetch trend & volatility regardless of key spelling ──────
  const trendValue =
    language === "en"
      ? crop.trend                        // e.g. "rising"
      : crop["रुझान"] || crop.trend;      // fallback to English key if needed

  const volatilityValue =
    language === "en"
      ? crop.volatility                   // e.g. "low"
      : crop["उतार-चढ़ाव"] || crop.volatility;

  // ── 3) build the combined line per language ────────────────────
  const trendVolText =
    language === "en"
      ? `Trend: ${trendValue}, Volatility: ${volatilityValue}`
      : `रुझान: ${trendValue}, उतार-चढ़ाव: ${volatilityValue}`;

  // ── 4) switch the views & inject all text ──────────────────────
  document.getElementById("cropList").classList.add("hidden");
  document.getElementById("analysisSection").classList.remove("hidden");

  document.getElementById("analysisTitle").textContent = cropName;
  document.getElementById("priceInfo").textContent =
    `${priceLabel}: ₹${crop.current_price} (${crop.unit})`;
  document.getElementById("trendVolatility").textContent = trendVolText;
  document.getElementById("summary").textContent = crop.summary;

  drawChart(crop.past_30_days, crop.predicted_7_days);
}


function drawChart(last30, next7) {
  const ctx = document.getElementById("priceChart").getContext("2d");
  if (currentChart) currentChart.destroy();

  const labels = [...Array(30).keys()].map(i => `D-${30 - i}`).concat(["+1", "+2", "+3", "+4", "+5", "+6", "+7"]);

  currentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Past 30 Days",
          data: [...last30, ...new Array(7).fill(null)],
          borderColor: "green",
          borderWidth: 2,
          fill: false
        },
        {
          label: "Predicted",
          data: [...new Array(30).fill(null), ...next7],
          borderColor: "red",
          borderDash: [5, 5],
          borderWidth: 2,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: false } }
    }
  });
}

function closeAnalysis() {
  document.getElementById("analysisSection").classList.add("hidden");
  document.getElementById("cropList").classList.remove("hidden");
}

document.getElementById("searchBtn").addEventListener("click", () => {
  const query = document.getElementById("searchInput").value;
  displayCropList(query);
});

document.getElementById("searchInput").addEventListener("input", (e) => {
  displayCropList(e.target.value);
});


window.onload = loadData;
