// Global variables
let dataDosen = [];
let resultChart = null;
let currentPage = 1;
let rowsPerPage = 10;
let filteredData = [];
let savedConfigs = JSON.parse(localStorage.getItem('weightConfigs') || '{}');
let selectedConfigName = '';

// Weight configuration
let bobot = {
  pub: 0.25,
  hki: 0.15,
  book: 0.15,
  research: 0.25,
  community: 0.2
};

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize tooltips
  tippy('[data-tippy-content]', {
    theme: 'light-border',
    placement: 'right',
    arrow: true
  });
  
  // Event listeners
  document.getElementById("fileInput").addEventListener("change", handleFileUpload);
  document.getElementById("manualForm").addEventListener("submit", tambahDataManual);
  document.getElementById("resetData").addEventListener("click", resetData);
  document.getElementById("exportBtn").addEventListener("click", exportHasil);
  document.getElementById("weightForm").addEventListener("submit", aturBobot);
  document.getElementById("compareBtn").addEventListener("click", showComparisonModal);
  document.getElementById("saveWeights").addEventListener("click", showSaveConfigModal);
  document.getElementById("loadWeights").addEventListener("click", showLoadConfigModal);
  
  // Search and filter elements
  document.getElementById("searchBtn").addEventListener("click", applySearchFilter);
  document.getElementById("applyFilter").addEventListener("click", applySearchFilter);
  document.getElementById("resetFilter").addEventListener("click", resetSearchFilter);
  document.getElementById("rowsPerPage").addEventListener("change", changeRowsPerPage);
  document.getElementById("prevPage").addEventListener("click", () => changePage(-1));
  document.getElementById("nextPage").addEventListener("click", () => changePage(1));

  // Modal close buttons
  document.querySelectorAll(".modal .close").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach(modal => {
        modal.style.display = "none";
      });
    });
  });

  // Config modal buttons
  document.getElementById("confirmSaveConfig").addEventListener("click", saveConfig);
  document.getElementById("confirmLoadConfig").addEventListener("click", loadSelectedConfig);
  document.getElementById("deleteConfig").addEventListener("click", deleteSelectedConfig);

  // Weight input events
  document.querySelectorAll("#weightForm input[type='number']").forEach(input => {
    input.addEventListener("input", updateTotalWeight);
  });

  // Chart tab events
  document.querySelectorAll(".chart-tab").forEach(tab => {
    tab.addEventListener("click", function() {
      document.querySelectorAll(".chart-tab").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      updateChart(this.dataset.chart);
    });
  });
  
  // Initialize weights UI
  updateWeightInputs();
  updateTotalWeight();
});

// Handle manual data input
function tambahDataManual(e) {
  e.preventDefault();
  try {
    const row = {
      "Nama Dosen": document.getElementById("nama").value,
      "NIDN": document.getElementById("nidn").value,
      "Fakultas": document.getElementById("fakultas").value,
      "Score Publication": parseFloat(document.getElementById("pub").value),
      "Score HKI": parseFloat(document.getElementById("hki").value),
      "Score Book": parseFloat(document.getElementById("book").value),
      "Score Research": parseFloat(document.getElementById("research").value),
      "Score Community Service": parseFloat(document.getElementById("community").value)
    };
    
    const newData = convertRow(row);
    dataDosen.push(newData);
    updateFakultasFilter(newData.fakultas);
    prosesSPK();
    document.getElementById("manualForm").reset();
  } catch (error) {
    alert(error.message);
  }
}

// Update weight total calculation
function updateTotalWeight() {
  const pub = parseInt(document.getElementById("weightPub").value) || 0;
  const hki = parseInt(document.getElementById("weightHki").value) || 0;
  const book = parseInt(document.getElementById("weightBook").value) || 0;
  const res = parseInt(document.getElementById("weightResearch").value) || 0;
  const comm = parseInt(document.getElementById("weightCommunity").value) || 0;
  const total = pub + hki + book + res + comm;
  
  document.getElementById("totalWeight").textContent = total;
  
  // Visual feedback for total weight
  const totalElement = document.getElementById("totalWeight");
  if (total === 100) {
    totalElement.style.color = "#27ae60";
  } else if (total > 100) {
    totalElement.style.color = "#e74c3c";
  } else {
    totalElement.style.color = "#f39c12";
  }
}

// Set weight configuration
function aturBobot(e) {
  e.preventDefault();
  
  const weightInputs = [
    document.getElementById("weightPub"),
    document.getElementById("weightHki"),
    document.getElementById("weightBook"),
    document.getElementById("weightResearch"),
    document.getElementById("weightCommunity")
  ];
  
  const total = weightInputs.map(i => parseInt(i.value) || 0).reduce((a, b) => a + b, 0);
  
  if (total !== 100) {
    alert(`Total bobot harus 100%. Saat ini: ${total}%`);
    return;
  }
  
  bobot = {
    pub: weightInputs[0].value / 100,
    hki: weightInputs[1].value / 100,
    book: weightInputs[2].value / 100,
    research: weightInputs[3].value / 100,
    community: weightInputs[4].value / 100
  };
  
  if (dataDosen.length > 0) {
    prosesSPK();
  }
  
  alert("Bobot diperbarui dan data dihitung ulang.");
}

// Reset all data
function resetData() {
  if (confirm("Yakin ingin menghapus semua data?")) {
    dataDosen = [];
    filteredData = [];
    currentPage = 1;
    resultChart?.destroy();
    resultChart = null;

    document.getElementById("fileInput").value = "";

    // Reset dropdown fakultas
    const fakultasFilter = document.getElementById("fakultasFilter");
    fakultasFilter.innerHTML = '<option value="">Semua Fakultas</option>';

    displayData(); // Ini akan menampilkan pesan "tidak ada data"
  }
}

// Data validation and conversion
function validateRow(row) {
  const errors = [];
  
  // Required fields validation
  if (!row["Nama Dosen"]) errors.push("Nama Dosen tidak boleh kosong");
  if (!row["NIDN"]) errors.push("NIDN tidak boleh kosong");
  if (!row["Fakultas"]) errors.push("Fakultas tidak boleh kosong");
  
  // Score validation (must be numeric and not negative)
  const scores = ["Score Publication", "Score HKI", "Score Book", "Score Research", "Score Community Service"];
  scores.forEach(score => {
    const value = row[score];
    if (value !== undefined && value !== "") {
      const num = parseFloat(value);
      if (isNaN(num)) errors.push(`${score} harus berupa angka`);
      else if (num < 0) errors.push(`${score} tidak boleh negatif`);
      else if (num > 100) errors.push(`${score} tidak boleh lebih dari 100`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

// Convert data row to standardized format
function convertRow(row) {
  const validation = validateRow(row);
  if (!validation.valid) {
    throw new Error(`Data tidak valid: ${validation.errors.join(", ")}`);
  }
  
  return {
    nama: row["Nama Dosen"],
    nidn: row["NIDN"],
    fakultas: row["Fakultas"],
    pub: parseFloat(row["Score Publication"]) || 0,
    hki: parseFloat(row["Score HKI"]) || 0,
    book: parseFloat(row["Score Book"]) || 0,
    research: parseFloat(row["Score Research"]) || 0,
    community: parseFloat(row["Score Community Service"]) || 0
  };
}

// Handle file upload (CSV/Excel)
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Show loading indicator
  document.getElementById("hasil").innerHTML = '<div class="spinner"></div><p class="text-center">Memproses file...</p>';
  
  if (file.name.endsWith(".csv")) {
    parseCSV(file);
  } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
    parseExcel(file);
  } else {
    alert("Format file tidak didukung. Silakan unggah file CSV atau Excel.");
    document.getElementById("hasil").innerHTML = "<p>Format file tidak didukung.</p>";
  }
}

// Parse CSV file
function parseCSV(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: function(results) {
      try {
        processFileData(results.data);
      } catch (error) {
        alert("Error saat memproses file CSV: " + error.message);
        document.getElementById("hasil").innerHTML = "<p>Gagal memproses file.</p>";
      }
    },
    error: err => {
      alert("Gagal membaca CSV: " + err);
      document.getElementById("hasil").innerHTML = "<p>Gagal membaca file.</p>";
    }
  });
}

// Parse Excel file
function parseExcel(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws);
      processFileData(jsonData);
    } catch (error) {
      alert("Error saat memproses file Excel: " + error.message);
      document.getElementById("hasil").innerHTML = "<p>Gagal memproses file Excel.</p>";
    }
  };
  reader.onerror = function() {
    alert("Gagal membaca file.");
    document.getElementById("hasil").innerHTML = "<p>Gagal membaca file.</p>";
  };
  reader.readAsArrayBuffer(file);
}

// Process data from uploaded file
function processFileData(data) {
  try {
    if (!data || data.length === 0) {
      throw new Error("File tidak berisi data.");
    }
    
    // Convert all rows and track all unique fakultas
    dataDosen = [];
    const fakultasSet = new Set();
    
    for (let i = 0; i < data.length; i++) {
      try {
        const dosen = convertRow(data[i]);
        dataDosen.push(dosen);
        fakultasSet.add(dosen.fakultas);
      } catch (error) {
        console.error(`Error pada baris ${i+1}:`, error);
        // Continue processing other rows
      }
    }
    
    // Update fakultas filter options
    updateFakultasFilterOptions(Array.from(fakultasSet));
    
    // Process decision support calculations
    prosesSPK();
    
  } catch (error) {
    alert("Error saat memproses data: " + error.message);
    document.getElementById("hasil").innerHTML = "<p>Gagal memproses data.</p>";
  }
}

// Update fakultas filter with new fakultas
function updateFakultasFilter(fakultas) {
  const fakultasFilter = document.getElementById("fakultasFilter");
  const options = Array.from(fakultasFilter.options).map(opt => opt.value);
  
  if (fakultas && !options.includes(fakultas)) {
    const option = document.createElement("option");
    option.value = fakultas;
    option.textContent = fakultas;
    fakultasFilter.appendChild(option);
  }
}

// Update fakultas filter with a list of fakultas
function updateFakultasFilterOptions(fakultasList) {
  const fakultasFilter = document.getElementById("fakultasFilter");
  
  // Keep the "All" option
  fakultasFilter.innerHTML = '<option value="">Semua Fakultas</option>';
  
  // Add unique fakultas options
  fakultasList.forEach(fakultas => {
    const option = document.createElement("option");
    option.value = fakultas;
    option.textContent = fakultas;
    fakultasFilter.appendChild(option);
  });
}

// The main SPK calculation process
function prosesSPK() {
  if (!dataDosen.length) return;
  
  const keys = ["pub", "hki", "book", "research", "community"];
  
  // SAW Method
  const max = {};
  keys.forEach(k => {
    max[k] = Math.max(...dataDosen.map(d => d[k])) || 1; // Avoid division by zero
  });
  
  dataDosen.forEach(d => {
    d.saw = keys.reduce((acc, k) => acc + (d[k] / max[k]) * bobot[k], 0);
  });
  
  // TOPSIS Method
  const rootSum = {};
  keys.forEach(k => {
    rootSum[k] = Math.sqrt(dataDosen.reduce((s, d) => s + d[k] ** 2, 0)) || 1; // Avoid division by zero
  });
  
  dataDosen.forEach(d => {
    d.topsis = {};
    keys.forEach(k => {
      d.topsis[k] = (d[k] / rootSum[k]) * bobot[k];
    });
  });
  
  const maxIdeal = {};
  const minIdeal = {};
  keys.forEach(k => {
    maxIdeal[k] = Math.max(...dataDosen.map(d => d.topsis[k]));
    minIdeal[k] = Math.min(...dataDosen.map(d => d.topsis[k]));
  });
  
  dataDosen.forEach(d => {
    const dPlus = Math.sqrt(keys.reduce((s, k) => s + (d.topsis[k] - maxIdeal[k]) ** 2, 0));
    const dMin = Math.sqrt(keys.reduce((s, k) => s + (d.topsis[k] - minIdeal[k]) ** 2, 0));
    d.topsisScore = dMin / (dPlus + dMin) || 0; // Avoid division by zero
  });
  
  // Calculate ranks
  const sortedSAW = [...dataDosen].sort((a, b) => b.saw - a.saw);
  const sortedTOPSIS = [...dataDosen].sort((a, b) => b.topsisScore - a.topsisScore);
  
  dataDosen.forEach(d => {
    d.sawRank = sortedSAW.findIndex(item => item.nidn === d.nidn) + 1;
    d.topsisRank = sortedTOPSIS.findIndex(item => item.nidn === d.nidn) + 1;
  });
  
  // Show results
  filteredData = [...dataDosen];
  displayData();
  updateChart(document.querySelector(".chart-tab.active").dataset.chart);
}

// Pagination functions
function changeRowsPerPage() {
  rowsPerPage = parseInt(document.getElementById("rowsPerPage").value);
  currentPage = 1;
  displayData();
}

function changePage(direction) {
  currentPage += direction;
  displayData();
}

// Filter and search functions
function applySearchFilter() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const fakultasFilter = document.getElementById("fakultasFilter").value;
  
  filteredData = dataDosen.filter(d => {
    const matchSearch = !searchTerm || 
  (d.nama && d.nama.toLowerCase().includes(searchTerm)) || 
  (d.nidn && d.nidn.toLowerCase().includes(searchTerm));
    const matchFakultas = !fakultasFilter || d.fakultas === fakultasFilter;
    return matchSearch && matchFakultas;
  });
  
  currentPage = 1;
  displayData();
}

function resetSearchFilter() {
  document.getElementById("searchInput").value = "";
  document.getElementById("fakultasFilter").value = "";
  filteredData = [...dataDosen];
  currentPage = 1;
  displayData();
}

// Display paginated and filtered data
function displayData() {
  if (!filteredData.length) {
    const msg = dataDosen.length === 0 
      ? "Semua data telah direset." 
      : "Tidak ada data yang sesuai dengan filter.";
    document.getElementById("hasil").innerHTML = `<p>${msg}</p>`;
    return;
  }
  
  // Sort by TOPSIS score
  const sorted = [...filteredData].sort((a, b) => b.topsisScore - a.topsisScore);
  
  // Calculate pagination
  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const currentPageData = sorted.slice(start, end);
  
  // Generate table
  let html = `
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Nama</th>
        <th>NIDN</th>
        <th>Fakultas</th>
        <th>Pub</th>
        <th>HKI</th>
        <th>Book</th>
        <th>Research</th>
        <th>Community</th>
        <th>SAW</th>
        <th>TOPSIS</th>
      </tr>
    </thead>
    <tbody>`;
  
  currentPageData.forEach((d, i) => {
    const rank = start + i + 1;
    html += `
      <tr>
        <td>${rank}</td>
        <td>${d.nama}</td>
        <td>${d.nidn}</td>
        <td>${d.fakultas}</td>
        <td>${d.pub.toFixed(2)}</td>
        <td>${d.hki.toFixed(2)}</td>
        <td>${d.book.toFixed(2)}</td>
        <td>${d.research.toFixed(2)}</td>
        <td>${d.community.toFixed(2)}</td>
        <td>${d.saw.toFixed(4)}</td>
        <td>${d.topsisScore.toFixed(4)}</td>
      </tr>`;
  });
  
  html += `</tbody></table>`;
  
  // Update pagination controls
  document.getElementById("pageInfo").textContent = `Halaman ${currentPage} dari ${totalPages}`;
  document.getElementById("prevPage").disabled = currentPage <= 1;
  document.getElementById("nextPage").disabled = currentPage >= totalPages;
  
  // Update results
  document.getElementById("hasil").innerHTML = html;
}

// Export results to CSV
function exportHasil() {
  if (!dataDosen.length) {
    return alert("Tidak ada data untuk diekspor");
  }
  
  const sorted = [...dataDosen].sort((a, b) => b.topsisScore - a.topsisScore);
  let csv = "Rank,Nama,NIDN,Fakultas,Pub,HKI,Book,Research,Community,SAW,SAW Rank,TOPSIS,TOPSIS Rank\n";
  
  sorted.forEach((d, i) => {
    csv += `${i + 1},"${d.nama}","${d.nidn}","${d.fakultas}",${d.pub.toFixed(2)},${d.hki.toFixed(2)},${d.book.toFixed(2)},${d.research.toFixed(2)},${d.community.toFixed(2)},${d.saw.toFixed(4)},${d.sawRank},${d.topsisScore.toFixed(4)},${d.topsisRank}\n`;
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hasil_ranking_dosen_" + new Date().toISOString().slice(0, 10) + ".csv";
  link.click();
}

// Update chart visualization
function updateChart(type) {
  if (!dataDosen.length) return;
  
  if (resultChart) resultChart.destroy();
  
  const ctx = document.getElementById("resultChart").getContext("2d");
  
  // Sort data by TOPSIS score for better visualization
  const sorted = [...dataDosen].sort((a, b) => b.topsisScore - a.topsisScore).slice(0, 10); // Limit to top 10
  
  // Prepare data based on chart type
  let config;
  
  if (type === "bar") {
    config = {
      type: 'bar',
      data: {
        labels: sorted.map(d => d.nama),
        datasets: [{
          label: 'Nilai TOPSIS',
          data: sorted.map(d => d.topsisScore),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Top 10 Dosen Berdasarkan Nilai TOPSIS'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `TOPSIS: ${context.raw.toFixed(4)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1
          }
        }
      }
    };
  } else if (type === "radar") {
    const topDosen = sorted.slice(0, 5); // Top 5 for radar chart
    
    config = {
      type: 'radar',
      data: {
        labels: ['Publikasi', 'HKI', 'Buku', 'Penelitian', 'Pengabdian'],
        datasets: topDosen.map((d, i) => ({
          label: d.nama,
          data: [d.pub / 100, d.hki / 100, d.book / 100, d.research / 100, d.community / 100],
          backgroundColor: `rgba(54, ${100 + i * 30}, 235, 0.2)`,
          borderColor: `rgba(54, ${100 + i * 30}, 235, 1)`,
          borderWidth: 1
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 1,
            ticks: {
              stepSize: 0.2
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Perbandingan Kriteria Top 5 Dosen'
          }
        }
      }
    };
  } else if (type === "comparison") {
    config = {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Perbandingan SAW vs TOPSIS',
          data: dataDosen.map(d => ({ x: d.saw, y: d.topsisScore, name: d.nama })),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Perbandingan Nilai SAW vs TOPSIS'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const point = context.raw;
                return [`${point.name}`, `SAW: ${point.x.toFixed(4)}`, `TOPSIS: ${point.y.toFixed(4)}`];
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Nilai SAW'
            },
            min: 0
          },
          y: {
            title: {
              display: true,
              text: 'Nilai TOPSIS'
            },
            min: 0,
            max: 1
          }
        }
      }
    };
  }
  
  resultChart = new Chart(ctx, config);
}

// Show comparison modal
function showComparisonModal() {
  if (dataDosen.length < 2) {
    return alert("Minimal diperlukan 2 data untuk perbandingan");
  }
  
  // Calculate correlation and other statistics between SAW and TOPSIS
  const n = dataDosen.length;
  const x = dataDosen.map(d => d.saw);
  const y = dataDosen.map(d => d.topsisScore);
  
  // Calculate correlation coefficient
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumXSq = x.reduce((a, b) => a + b * b, 0);
  const sumYSq = y.reduce((a, b) => a + b * b, 0);
  
  const r = (n * sumXY - sumX * sumY) / 
          (Math.sqrt((n * sumXSq - sumX * sumX) * (n * sumYSq - sumY * sumY)));
          
  // Calculate rank correlation (Spearman's)
  const sawRanks = dataDosen.map(d => d.sawRank);
  const topsisRanks = dataDosen.map(d => d.topsisRank);
  
  let dSquaredSum = 0;
  for (let i = 0; i < n; i++) {
    dSquaredSum += Math.pow(sawRanks[i] - topsisRanks[i], 2);
  }
  
  const rho = 1 - (6 * dSquaredSum) / (n * (n * n - 1));
  
  // Count rank differences
  const sameRank = dataDosen.filter(d => d.sawRank === d.topsisRank).length;
  const diffOneRank = dataDosen.filter(d => Math.abs(d.sawRank - d.topsisRank) === 1).length;
  const diffMoreRanks = n - sameRank - diffOneRank;
  
  // Find largest rank difference
  let maxDiff = 0;
  let maxDiffDosen = null;
  dataDosen.forEach(d => {
    const diff = Math.abs(d.sawRank - d.topsisRank);
    if (diff > maxDiff) {
      maxDiff = diff;
      maxDiffDosen = d;
    }
  });
  
  // Display comparison results
  const comparisonResult = document.getElementById("comparisonResult");
  
  let html = `
    <div class="comparison-stats">
      <h4>Statistik Perbandingan</h4>
      <p><strong>Korelasi nilai (Pearson):</strong> ${r.toFixed(4)}</p>
      <p><strong>Korelasi ranking (Spearman):</strong> ${rho.toFixed(4)}</p>
      <p><strong>Jumlah dosen dengan ranking sama:</strong> ${sameRank} dari ${n} (${(sameRank/n*100).toFixed(1)}%)</p>
      <p><strong>Jumlah dosen dengan perbedaan 1 ranking:</strong> ${diffOneRank} (${(diffOneRank/n*100).toFixed(1)}%)</p>
      <p><strong>Jumlah dosen dengan perbedaan >1 ranking:</strong> ${diffMoreRanks} (${(diffMoreRanks/n*100).toFixed(1)}%)</p>
    </div>`;
    
  if (maxDiffDosen) {
    html += `
      <div class="largest-diff">
        <h4>Perbedaan Ranking Terbesar</h4>
        <p><strong>Dosen:</strong> ${maxDiffDosen.nama}</p>
        <p><strong>Ranking SAW:</strong> ${maxDiffDosen.sawRank}</p>
        <p><strong>Ranking TOPSIS:</strong> ${maxDiffDosen.topsisRank}</p>
        <p><strong>Beda Ranking:</strong> ${maxDiff}</p>
      </div>`;
  }
  
  html += `
    <div class="comparison-table">
      <h4>Detail Perbandingan (Top 10)</h4>
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Nilai SAW</th>
            <th>Ranking SAW</th>
            <th>Nilai TOPSIS</th>
            <th>Ranking TOPSIS</th>
            <th>Beda Ranking</th>
          </tr>
        </thead>
        <tbody>`;
  
  // Sort by TOPSIS score for table
  const sorted = [...dataDosen].sort((a, b) => b.topsisScore - a.topsisScore).slice(0, 10);
  
  sorted.forEach(d => {
      const rankDiff = Math.abs(d.sawRank - d.topsisRank);
    html += `
      <tr>
        <td>${d.nama}</td>
        <td>${d.saw.toFixed(4)}</td>
        <td>${d.sawRank}</td>
        <td>${d.topsisScore.toFixed(4)}</td>
        <td>${d.topsisRank}</td>
        <td>${rankDiff}</td>
      </tr>`;
  });

  html += `</tbody></table></div>`;

  comparisonResult.innerHTML = html;
  document.getElementById("comparisonModal").style.display = "block";
}

// Show modal for saving weight config
function showSaveConfigModal() {
  selectedConfigName = '';
  document.getElementById("configTitle").textContent = "Simpan Konfigurasi Bobot";
  document.getElementById("configName").value = "";
  populateSavedConfigs();
  document.getElementById("configModal").style.display = "block";
}

// Show modal for loading config
function showLoadConfigModal() {
  selectedConfigName = '';
  document.getElementById("configTitle").textContent = "Muat Konfigurasi Bobot";
  document.getElementById("configName").value = "";
  populateSavedConfigs();
  document.getElementById("configModal").style.display = "block";
}

// Populate list of saved configs
function populateSavedConfigs() {
  const container = document.getElementById("savedConfigs");
  container.innerHTML = "";

  Object.keys(savedConfigs).forEach(name => {
    const div = document.createElement("div");
    div.classList.add("config-item");
    if (name === selectedConfigName) div.classList.add("selected");
    div.textContent = name;
    div.addEventListener("click", () => {
      document.querySelectorAll(".config-item").forEach(el => el.classList.remove("selected"));
      div.classList.add("selected");
      selectedConfigName = name;
      document.getElementById("configName").value = name;
    });
    container.appendChild(div);
  });
}

// Save weight configuration
function saveConfig() {
  const name = document.getElementById("configName").value.trim();
  if (!name) return alert("Nama konfigurasi tidak boleh kosong.");

  savedConfigs[name] = {
    pub: document.getElementById("weightPub").value,
    hki: document.getElementById("weightHki").value,
    book: document.getElementById("weightBook").value,
    research: document.getElementById("weightResearch").value,
    community: document.getElementById("weightCommunity").value
  };

  localStorage.setItem("weightConfigs", JSON.stringify(savedConfigs));
  alert("Konfigurasi berhasil disimpan.");
  document.getElementById("configModal").style.display = "none";
}

// Load selected weight config
function loadSelectedConfig() {
  if (!selectedConfigName || !savedConfigs[selectedConfigName]) {
    return alert("Pilih konfigurasi yang ingin dimuat.");
  }

  const config = savedConfigs[selectedConfigName];
  document.getElementById("weightPub").value = config.pub;
  document.getElementById("weightHki").value = config.hki;
  document.getElementById("weightBook").value = config.book;
  document.getElementById("weightResearch").value = config.research;
  document.getElementById("weightCommunity").value = config.community;

  updateTotalWeight();
  aturBobot(new Event("submit"));
  document.getElementById("configModal").style.display = "none";
}

// Delete selected config
function deleteSelectedConfig() {
  if (!selectedConfigName || !savedConfigs[selectedConfigName]) {
    return alert("Pilih konfigurasi yang ingin dihapus.");
  }

  if (confirm(`Hapus konfigurasi "${selectedConfigName}"?`)) {
    delete savedConfigs[selectedConfigName];
    localStorage.setItem("weightConfigs", JSON.stringify(savedConfigs));
    selectedConfigName = '';
    populateSavedConfigs();
  }
}

// Update weight inputs from global `bobot`
function updateWeightInputs() {
  document.getElementById("weightPub").value = bobot.pub * 100;
  document.getElementById("weightHki").value = bobot.hki * 100;
  document.getElementById("weightBook").value = bobot.book * 100;
  document.getElementById("weightResearch").value = bobot.research * 100;
  document.getElementById("weightCommunity").value = bobot.community * 100;
}
