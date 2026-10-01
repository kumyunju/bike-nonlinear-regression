// 기온(℃), 자전거 대여량(대) 예제 데이터
const DATA = [
  [0, 120], [2, 180], [4, 240], [6, 310], [8, 390],
  [10, 480], [12, 570], [14, 670], [16, 780], [18, 900],
  [20, 1030], [22, 1150], [24, 1260], [26, 1370], [28, 1480],
  [30, 1560], [32, 1630], [34, 1680]
];

// 2차 최소제곱회귀: y = ax^2 + bx + c
function quadraticRegression(data) {
  let n = data.length;
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

  // Normal equations:
  // [sx4 sx3 sx2][a] = [sx2y]
  // [sx3 sx2 sx ][b] = [sxy]
  // [sx2 sx  n  ][c] = [sy]
  const M = [
    [sx4, sx3, sx2, sx2y],
    [sx3, sx2, sx,  sxy],
    [sx2, sx,  n,   sy]
  ];

  // Gaussian elimination with partial pivoting
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
  let ssRes = 0;
  let ssTot = 0;

  for (const [x, y] of data) {
    const yHat = predict(x, model);
    ssRes += (y - yHat) ** 2;
    ssTot += (y - meanY) ** 2;
  }

  return 1 - ssRes / ssTot;
}

function fmtNumber(value, digits = 4) {
  return Number(value).toFixed(digits);
}

function formatEquation(model) {
  const { a, b, c } = model;
  const signB = b >= 0 ? "+" : "-";
  const signC = c >= 0 ? "+" : "-";
  return `Y = ${fmtNumber(a)}X² ${signB} ${fmtNumber(Math.abs(b))}X ${signC} ${fmtNumber(Math.abs(c))}`;
}

const model = quadraticRegression(DATA);
const r2 = calculateR2(DATA, model);

document.getElementById("equation").textContent = formatEquation(model);
document.getElementById("r2").textContent = fmtNumber(r2, 4);
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
  result.textContent = `${x}℃에서 예상 자전거 대여량은 약 ${Math.max(0, Math.round(y)).toLocaleString()}대입니다.`;
});

document.getElementById("temperature").addEventListener("keydown", (event) => {
  if (event.key === "Enter") document.getElementById("predictBtn").click();
});

// 실제 데이터 점
const scatterData = DATA.map(([x, y]) => ({ x, y }));

// 부드러운 비선형 회귀곡선
const curveData = [];
const minX = DATA[0][0];
const maxX = DATA[DATA.length - 1][0];

for (let i = 0; i <= 100; i++) {
  const x = minX + (maxX - minX) * i / 100;
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
        title: {
          display: true,
          text: "기온(℃)"
        }
      },
      y: {
        title: {
          display: true,
          text: "자전거 대여량(대)"
        }
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  }
});

// 처음 실행했을 때 기본값 20℃의 예측 결과 표시
document.getElementById("predictBtn").click();
