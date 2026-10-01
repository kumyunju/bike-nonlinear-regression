const DATA = [
  [0, 1500], [2, 1320], [4, 1160], [6, 1010], [8, 880],
  [10, 760], [12, 650], [14, 560], [16, 500], [18, 460],
  [20, 440], [22, 450], [24, 480], [26, 530], [28, 610],
  [30, 720], [32, 850], [34, 1010], [36, 1190], [38, 1410]
];

// 2차 최소제곱회귀: Y = aX² + bX + c
function quadraticRegression(data) {
  const n = data.length;
  let sx = 0, sx2 = 0, sx3 = 0, sx4 = 0;
  let sy = 0, sxy = 0, sx2y = 0;

  for (const [x, y] of data) {
    const x2 = x * x;
    sx += x;
    sx2 += x2;
    sx3 += x2 * x;
    sx4 += x2 * x2;
    sy += y;
    sxy += x * y;
    sx2y += x2 * y;
  }

  const M = [
    [sx4, sx3, sx2, sx2y],
    [sx3, sx2, sx,  sxy],
    [sx2, sx,  n,   sy]
  ];

  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];

    for (let row = col + 1; row < 3; row++) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j < 4; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }

  const coef = [0, 0, 0];
  for (let row = 2; row >= 0; row--) {
    let value = M[row][3];
    for (let j = row + 1; j < 3; j++) {
      value -= M[row][j] * coef[j];
    }
    coef[row] = value / M[row][row];
  }

  return { a: coef[0], b: coef[1], c: coef[2] };
}

function predict(x, model) {
  return model.a * x * x + model.b * x + model.c;
}

function calculateR2(data, model) {
  const meanY = data.reduce((sum, [, y]) => sum + y, 0) / data.length;
  let ssRes = 0, ssTot = 0;

  for (const [x, y] of data) {
    const yHat = predict(x, model);
    ssRes += (y - yHat) ** 2;
    ssTot += (y - meanY) ** 2;
  }

  return 1 - ssRes / ssTot;
}

function fmt(value, digits = 4) {
  return Number(value).toFixed(digits);
}

function equationText(model) {
  const a = model.a;
  const b = model.b;
  const c = model.c;
  const bSign = b >= 0 ? "+" : "-";
  const cSign = c >= 0 ? "+" : "-";

  return `Y = ${fmt(a)}X² ${bSign} ${fmt(Math.abs(b))}X ${cSign} ${fmt(Math.abs(c))}`;
}

const model = quadraticRegression(DATA);
const r2 = calculateR2(DATA, model);

document.getElementById("equation").textContent = equationText(model);
document.getElementById("r2").textContent = fmt(r2, 4);
document.getElementById("dataCount").textContent = `${DATA.length}개`;

const tableBody = document.getElementById("dataTable");
DATA.forEach(([x, y], i) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${i + 1}</td><td>${x}</td><td>${y.toLocaleString()}</td>`;
  tableBody.appendChild(tr);
});

document.getElementById("predictBtn").addEventListener("click", () => {
  const x = Number(document.getElementById("temperature").value);
  const result = document.getElementById("prediction");

  if (!Number.isFinite(x)) {
    result.textContent = "기온을 입력해주세요.";
    return;
  }

  const y = predict(x, model);
  result.textContent =
    `${x}℃에서 예상 자전거 대여량은 약 ${Math.max(0, Math.round(y)).toLocaleString()}대입니다.`;
});

document.getElementById("temperature").addEventListener("keydown", (event) => {
  if (event.key === "Enter") document.getElementById("predictBtn").click();
});

const scatterData = DATA.map(([x, y]) => ({ x, y }));
const curveData = [];

for (let i = 0; i <= 160; i++) {
  const x = 38 * i / 160;
  curveData.push({ x, y: predict(x, model) });
}

new Chart(document.getElementById("regressionChart"), {
  type: "scatter",
  data: {
    datasets: [
      {
        label: "실제 데이터",
        data: scatterData,
        pointRadius: 5,
        showLine: false
      },
      {
        label: "2차 비선형 회귀곡선",
        data: curveData,
        type: "line",
        pointRadius: 0,
        borderWidth: 3,
        tension: 0.15
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: "기온(℃)" }
      },
      y: {
        title: { display: true, text: "자전거 대여량(대)" },
        beginAtZero: true
      }
    }
  }
});

document.getElementById("predictBtn").click();
