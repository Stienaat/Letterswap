/* ============================================================
   10LETTERWOORD — COMPLETE ENGINE (1 BESTAND)
   ============================================================ */

/* ------------------------------------------------------------
   1. CONFIG & STATE
   ------------------------------------------------------------ */

const WORD_LENGTH = 10;
const TOTAL_ROUNDS = 10;

let woordPool = [];
let bag = null;

let currentWord = "";
let scrambled = [];
let grid = [[], []]; // 2 rijen × 10 kolommen

let round = 1;
let strafpunten = 0;
let seconden = 0;
let timerGestart = false;
let timerInterval = null;

let selected = null;
let score = 0;

let topScore = null; // laagste strafpunten ooit
let woordIsCorrect = false;
let hintCells = Array(WORD_LENGTH).fill(false);
let longPressCount = 0;
const MAX_LONGPRESSES = 2;


let currentLanguage = "nl";

function getLang() {
  return currentLanguage;
}

function t(key) {
  return (window.strings?.translations?.[getLang()]?.[key]) || key;
}

/* ------------------------------------------------------------
   2. SHUFFLEBAG + SHUFFLE
   ------------------------------------------------------------ */

class ShuffleBagCooldown {
    constructor(words, cooldownShuffles = 10) {
        this.original = [...words];
        this.cooldownShuffles = cooldownShuffles;
        this.bag = [];
        this.cooldown = new Map();
        this.refill();
    }

    refill() {
        for (const [word, cd] of this.cooldown.entries()) {
            if (cd <= 1) this.cooldown.delete(word);
            else this.cooldown.set(word, cd - 1);
        }

        this.bag = this.original.filter(w => !this.cooldown.has(w));

        for (let i = this.bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
    }

    draw() {
        if (this.bag.length === 0) this.refill();
        const word = this.bag.pop();
        this.cooldown.set(word, this.cooldownShuffles);
        return word;
    }
}

function fisherYatesShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/* ------------------------------------------------------------
   3. LOAD WORDS
   ------------------------------------------------------------ */

async function laadWoorden() {
    const res = await fetch("woorden.txt");
    const text = await res.text();

    woordPool = text
        .split(/\r?\n/)
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length === WORD_LENGTH);

    bag = new ShuffleBagCooldown(woordPool, 10);
}

function kiesNieuwWoord() {
    return bag.draw();
}

/* ------------------------------------------------------------
   4. START GAME / RONDES
   ------------------------------------------------------------ */
function startRonde() {
	
    currentWord = kiesNieuwWoord();
    solutionWord = currentWord.split("");

    // FIX: reset hint state
    hintCells = Array(WORD_LENGTH).fill(false);

    grid = [
        fisherYatesShuffle(solutionWord.slice()),
        Array(WORD_LENGTH).fill("")
    ];
	startTimerIfNeeded()
    renderGrid();
}

function startGame() {
	startTimerIfNeeded()
    strafpunten = 0;
    seconden = 0;
    round = 1;
    updateStrafpunten();
    updateTimerDisplay();
    loadTopScore();
	
	  initToolbar();
    startRonde();
}

/* ------------------------------------------------------------
   5. GRID RENDERING
   ------------------------------------------------------------ */
function onLongPress(r, c) {
		 
    if (longPressCount >= MAX_LONGPRESSES) {
		showMessage(t("hints"));
    return;
    }

    longPressCount++;
    strafpunten += 2;
    updateStrafpunten();

    // Jouw echte hintfunctie
    geefHint(r, c);
}

function renderGrid() {
    const el = document.getElementById("grid");
    el.innerHTML = "";

    for (let r = 0; r < 2; r++) {
        const row = document.createElement("div");
        row.className = "grid-row";

        for (let c = 0; c < WORD_LENGTH; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.textContent = grid[r][c];

            // HINT KLEUR
            if (r === 1 && hintCells[c] && grid[1][c] !== "") {
                cell.classList.add("hint");
            }

            // LONGPRESS
            let pressTimer = null;

            cell.onmousedown = () => {
                pressTimer = setTimeout(() => {
                    onLongPress(r, c);
                }, 600);
            };

            cell.onmouseup = () => {
                clearTimeout(pressTimer);
            };

            cell.onmouseleave = () => {
                clearTimeout(pressTimer);
            };

            // CLICK (swap)
            cell.onclick = () => {
                handleCellClick(r, c);
            };
			clearMessage()
            row.appendChild(cell);
        }

        el.appendChild(row);
    }
}

/* ------------------------------------------------------------
   6. SWAP LOGICA
   ------------------------------------------------------------ */

function handleCellClick(r, c) {
    if (r === 1 && hintCells[c]) return; // vast = niet klikbaar

    if (!selected) {
        selected = { r, c };
        highlight(r, c);
        return;
    }

    swap(selected.r, selected.c, r, c);
    selected = null;
    clearHighlights();

    checkSolved();
}

function swap(r1, c1, r2, c2) {
    const a = grid[r1][c1];
    const b = grid[r2][c2];

    // lege cel mag niet "actief" naar een letter verplaatsen
    if (a === "" && b !== "") return;

    // hint‑cellen blijven altijd vast
    if ((r1 === 1 && hintCells[c1]) || (r2 === 1 && hintCells[c2])) return;

    grid[r1][c1] = b;
    grid[r2][c2] = a;

    renderGrid();
}

/* ------------------------------------------------------------
   7. CHECK SOLVED
   ------------------------------------------------------------ */

function checkSolved() {
    const bottom = grid[1].join("");
	longPressCount = 0;
	checkEindeSpel();
	
    if (bottom === currentWord) {
        addWordToBoard(currentWord, "green");
		round++;
        startRonde();
    }
}

function markCorrect() {
    const cells = document.querySelectorAll(".grid-row:nth-child(2) .cell");
    cells.forEach(c => c.classList.add("correct"));
}

function nieuwWoord() {
    longPressCount = 0;
  
        strafpunten += 5;
        updateStrafpunten();

    woordIsCorrect = false;
    startRonde();
}




/* =========================
   8. MESSAGE / MODAL UI
   ========================= */
   
function showMessage(text, html = "", callback = null) {
    const box = document.getElementById("messageBox");

    box.querySelector(".message-text").innerHTML = text;
    box.querySelector(".message-html").innerHTML = html;

    box.classList.add("visible");

    // callback NA het renderen
    if (callback) {
        setTimeout(() => callback(), 0);
    }
}


function clearMessage() {
  showMessage(t("defaultMessage"));
}

function nieuwSpel() {
	showMessage(
	  t("confirmNewGame"),
	  `
		<div class="confirm-box">
			<button class="btn btn-green">Ja</button>
			<button class="btn btn-red">Nee</button>
		</div>
	  `
	);
}

function startNewGame() {
	longPressCount = 0;
    clearInterval(timerInterval);
    timerGestart = false;
	strafpunten = 0;
    seconden = 0;
    round = 1;
    woordIsCorrect = false;
    clearMessage();
    startGame();   // of hoe jouw spel start
}

function initToolbar() {
 const buttons = document.querySelectorAll("#toolbar button[data-level]");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const newLevel = Number(btn.dataset.level);
      if (level === newLevel) return;



document.getElementById("confirmYes").onclick = () => {
    level = newLevel;

    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    updatetopScoreDisplay();
    maakGrid();

	showMessage(t("defaultMessage"));
};

document.getElementById("confirmNo").onclick = clearMessage;
    });
  });
}





/*  MODAL   */

document.getElementById("readmeBtn").addEventListener("click", () => {
    openModal(`
		<h4>${t("modalInfoTitle")}</h4>
		<div>${t("modalInfoBody")}</div>
	`);
});

function openModal(contentHTML) {
	document.getElementById("modalBody").innerHTML = contentHTML;
	document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}


/* =========================
   8.1 HINT / 
   ========================= */

function geefHint(r, c) {
    const letter = grid[r][c];
    if (!letter) return;

    // Zoek een geschikte doelpositie voor deze letter
    let correctPos = -1;
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (currentWord[i] === letter && !hintCells[i]) {
            // deze positie is bedoeld voor deze letter en nog niet als hint vastgezet
            correctPos = i;
            break;
        }
    }

    if (correctPos === -1) return; // geen bruikbare positie meer

    // Als de letter daar al goed staat → niets doen
    if (grid[1][correctPos] === letter) return;

    const existing = grid[1][correctPos];

    // swap‑achtig gedrag:
    if (existing !== "") {
        grid[r][c] = existing;   // wat daar stond, gaat terug naar de klikplek
    } else {
        grid[r][c] = "";         // anders wordt de klikplek leeg
    }

    grid[1][correctPos] = letter;

    // Hint vastleggen
    hintCells[correctPos] = true;

    strafpunten += 2;
    updateStrafpunten();

    renderGrid();
}

/* ------------------------------------------------------------
   9. BOARD
   ------------------------------------------------------------ */

function addWordToBoard(word, color = "green") {
    const board = document.getElementById("board");
    const div = document.createElement("div");
    div.className = "board-word " + color;
    div.textContent = word;
    board.appendChild(div);
}


/* ------------------------------------------------------------
   10. TIMER
   ------------------------------------------------------------ */
function startTimer() {
  seconden = 0;
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    seconden++;
    updateTimer();
  }, 1000);
}

function startTimerIfNeeded() {
    if (timerGestart) return;

    timerGestart = true;
    timerInterval = setInterval(() => {
        seconden++;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const min = Math.floor(seconden / 60);
    const sec = seconden % 60;

    document.getElementById("Timer").textContent =
        "T: " +
        String(min).padStart(2, "0") + ":" +
        String(sec).padStart(2, "0");
}

/* =========================
   11. TAAL
   ========================= */

function openTaalKeuze() {
	showMessage(
    t("language"),
    `
      <div class="lang-select">
        <button data-lang="nl"><img src="images/NL.png" alt="NL"></button>
        <button data-lang="fr"><img src="images/FR.png" alt="FR"></button>
        <button data-lang="en"><img src="images/EN.png" alt="EN"></button>
        <button data-lang="de"><img src="images/DE.png" alt="DE"></button>
      </div>    `
  );

  document.querySelectorAll(".lang-select button").forEach(btn => {
    btn.onclick = async () => {
      await switchLanguage(btn.dataset.lang);
      clearMessage();
    };
  });
}

async function switchLanguage(langCode) {
  strings.setLanguage(langCode);

  const img = document.querySelector("#langBtn img");
  if (img) img.src = `images/${langCode.toUpperCase()}.png`;

  woordenBestand = langCode === "nl" ? "woorden.txt" : `woorden_${langCode}.txt`;

  await laadWoorden();
  woordBag = new ShuffleBagCooldown(woordPool, 5);
  renderGrid();
  clearMessage();
  
}
/* ------------------------------------------------------------
   12. STRAFPUNTEN / SCORE
   ------------------------------------------------------------ */

function updateStrafpunten() {
    document.getElementById("Faults").textContent =
        "Score: " + strafpunten;
}

function loadTopScore() {
    const saved = localStorage.getItem("10letter_topscore");
    topScore = saved ? Number(saved) : null;

    updateTopScoreDisplay();
}

function saveTopScore() {
    localStorage.setItem("10letter_topscore", topScore);
}

function updateTopScoreDisplay() {
    const el = document.getElementById("Topscore");
    if (!el) return;

    el.textContent = "Topscore: " + (topScore ?? "-");
}

function updateTopScoreIfNeeded() {
    if (topScore === null || strafpunten < topScore) {
        topScore = strafpunten;
        saveTopScore();
        updateTopScoreDisplay();
    }
}

/* ------------------------------------------------------------
   13. JOKER & OPLOSSING
   ------------------------------------------------------------ */

function joker() {
    strafpunten += 5;
    updateStrafpunten();
	longPressCount = 0;

}
function toonOplossing() {
    strafpunten += 10;
    updateStrafpunten();
	longPressCount = 0;
	round++;
	checkEindeSpel();
    addWordToBoard(currentWord, "red");

    // FIX: zet het woord in cooldown
    bag.cooldown.set(currentWord, bag.cooldownShuffles);

    // FIX: forceer refill zodat draw() nieuwe woorden heeft
    bag.refill();

    woordIsCorrect = false;
    startRonde();
}

/* ------------------------------------------------------------
   15. EINDE SPEL
   ------------------------------------------------------------ */

/*   EINDE SPEL   */

function checkEindeSpel() {
    if (round > 10) {
        endGame();
    }
}

function colorFullWordGreen() {
    document.querySelectorAll('#grid .cell').forEach(tile => {
        tile.classList.add('fullgreen');
    });
}

function onWordFound(word) {
    word.found = true;
    highlightWord(word);

    if (allWordsFound()) {
        colorFullWordGreen();
    }
}

document.getElementById("jokerBtn").addEventListener("click", () => {nieuwWoord();});

document.getElementById("newGameBtn").addEventListener("click", nieuwSpel); 

document.getElementById("solutionBtn").addEventListener("click", toonOplossing);

document.getElementById("langBtn").addEventListener("click", openTaalKeuze); 

document.getElementById("modalClose").addEventListener("click", closeModal);


function endGame() {
    clearInterval(timerInterval);
    updateTopScoreIfNeeded();
    startFireworks();
}


/* ------------------------------------------------------------
   16. HIGHLIGHT HELPERS
   ------------------------------------------------------------ */

function highlight(r, c) {
    const cell = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
    if (cell) cell.classList.add("selected");
}

function clearHighlights() {
    document.querySelectorAll(".cell").forEach(c => c.classList.remove("selected"));
}

/* =========================
   18. VUURWERK 
   ========================= */

function startFireworks(done) {
    const canvas = document.getElementById("fireworksCanvas");
    const ctx = canvas.getContext("2d");

    // Canvas zichtbaar maken
    canvas.classList.remove("hidden");
    canvas.style.display = "block";
    canvas.style.background = "rgba(0,0,0,0.95)";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    let running = true;

    // --- HSL → RGBA converter (perfect werkend) ---
    function hslToRgba(h, s, l, a) {
        s /= 100;
        l /= 100;

        const k = n => (n + h / 30) % 12;
        const f = n =>
            l - s * Math.min(l, 1 - l) *
            Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

        return `rgba(${Math.round(255 * f(0))}, ${Math.round(255 * f(8))}, ${Math.round(255 * f(4))}, ${a})`;
    }

    // --- Explosie maken ---
    function createExplosion() {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.7;

        for (let i = 0; i < 120; i++) {
            particles.push({
                x,
                y,
                angle: Math.random() * Math.PI * 2,
                speed: Math.random() * 5 + 2,
                alpha: 1,
                radius: 2 + Math.random() * 3,
                color: {
                    h: Math.random() * 360,
                    s: 100,
                    l: 50 + Math.random() * 30
                }
            });
        }
    }

    // --- Animatie ---
    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles = particles.filter(p => p.alpha > 0);

        particles.forEach(p => {
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.alpha -= 0.015;

            ctx.fillStyle = hslToRgba(p.color.h, p.color.s, p.color.l, p.alpha);

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        if (running) {
            requestAnimationFrame(update);
        } else {
            // Canvas verbergen
            canvas.classList.add("hidden");
            canvas.style.display = "none";
            canvas.style.background = "transparent";

          if (done) done();
        }
    }

    // --- Meerdere explosies ---
    let count = 0;
    const interval = setInterval(() => {
        createExplosion();
        count++;
        if (count >= 8) {
            clearInterval(interval);
            setTimeout(() => running = false, 2000);
        }
    }, 300);

    update();
}
/* ------------------------------------------------------------
   19. INIT
   ------------------------------------------------------------ */

window.addEventListener("DOMContentLoaded", async () => {
 
    await laadWoorden();

    startGame();
});
