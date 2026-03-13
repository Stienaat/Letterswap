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
const MAX_LONGPRESSES = 3;


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


/* ------------------------------------------------------------
   4. START GAME / RONDES
   ------------------------------------------------------------ */

function startGame() {
    strafpunten = 0;
    seconden = 0;
    round = 1;

    updateStrafpunten();
    updateTimerDisplay();
    loadTopScore();

    startRonde();
}

function startRonde() {
	longPressCount = 0;
    currentWord = bag.draw();
    scrambled = fisherYatesShuffle(currentWord.split(""));

    grid[0] = [...scrambled];
    grid[1] = Array(WORD_LENGTH).fill("");

    renderGrid();
    startTimerIfNeeded();
}


/* ------------------------------------------------------------
   5. GRID RENDERING
   ------------------------------------------------------------ */

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

            // HINT KLEUR EN VASTZETTEN
        if (r === 1 && hintCells[c] && grid[1][c] !== "") {
		cell.classList.add("hint");
		}


            // LONGPRESS
			
function onLongPress(r, c) {
    if (longPressCount >= MAX_LONGPRESSES) {
        console.log("Max longpresses bereikt");
        return;
    }

    longPressCount++;

    // Strafpunten voor longpress
    strafpunten += 2;
    updateStrafpunten();

    console.log("Longpress:", longPressCount);

    // Jouw echte hintfunctie
    geefHint(r, c);
}


			
			
        let pressTimer;
        cell.addEventListener("mousedown", () => {
		pressTimer = setTimeout(() => {
			onLongPress(r, c);
		}, 600);

        });
        cell.addEventListener("mouseup", () => clearTimeout(pressTimer));
        cell.addEventListener("mouseleave", () => clearTimeout(pressTimer));

            // CLICK (swap)
        cell.addEventListener("click", () => handleCellClick(r, c));

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

    if (bottom === currentWord) {
        markCorrect();
        woordIsCorrect = true;

        colorFullWordGreen();   // ← DIT is de juiste plek
    } else {
        woordIsCorrect = false;
    }
}



function markCorrect() {
    const cells = document.querySelectorAll(".grid-row:nth-child(2) .cell");
    cells.forEach(c => c.classList.add("correct"));
}

function nieuwWoord() {
	
    if (woordIsCorrect) {
        addWordToBoard(currentWord, "green");
    } else {
        strafpunten += 5;
        updateStrafpunten();
    }

    woordIsCorrect = false;
    startRonde();
}



function nieuwSpel() {
    clearInterval(timerInterval);
    timerGestart = false;

    strafpunten = 0;
    seconden = 0;
    round = 1;
    woordIsCorrect = false;

    document.getElementById("board").innerHTML = "";

    updateStrafpunten();
    updateTimerDisplay();

    startRonde();
}

function toonOplossing() {
    strafpunten += 10;
    updateStrafpunten();

    grid[1] = currentWord.split("");
    renderGrid();

    // letters rood maken
    const cells = document.querySelectorAll(".grid-row:nth-child(2) .cell");
    cells.forEach(c => c.classList.add("red"));

    addWordToBoard(currentWord, "red");
    woordIsCorrect = false; // want dit is geen correcte oplossing
}

function openTaalKeuze() {
    showModal(`
        <h2>Kies je taal</h2>
        <div class="flag-row">
            <img src="img/nl.png" class="flag" onclick="setLanguage('nl')">
            <img src="img/en.png" class="flag" onclick="setLanguage('en')">
            <img src="img/fr.png" class="flag" onclick="setLanguage('fr')">
        </div>
    `);
}

function openReadme() {
    showModal(`
        <h2>${t("uitleg_titel")}</h2>
        <p>${t("uitleg_tekst")}</p>
    `);
}

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

function allWordsFound() {
    return words.every(w => w.found === true);
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





document.getElementById("jokerBtn").addEventListener("click", nieuwWoord);
document.getElementById("newGameBtn").addEventListener("click", nieuwSpel);
document.getElementById("solutionBtn").addEventListener("click", toonOplossing);
document.getElementById("langBtn").addEventListener("click", openTaalKeuze);
document.getElementById("readmeBtn").addEventListener("click", openReadme);


/* ------------------------------------------------------------
   8. BOARD
   ------------------------------------------------------------ */

function addWordToBoard(word, color = "green") {
    const board = document.getElementById("board");
    const div = document.createElement("div");
    div.className = "board-word " + color;
    div.textContent = word;
    board.appendChild(div);
}


/* ------------------------------------------------------------
   9. TIMER
   ------------------------------------------------------------ */

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


/* ------------------------------------------------------------
   10. STRAFPUNTEN
   ------------------------------------------------------------ */

function updateStrafpunten() {
    document.getElementById("Faults").textContent =
        "Strafpt'n: " + strafpunten;
}


/* ------------------------------------------------------------
   11. JOKER & OPLOSSING
   ------------------------------------------------------------ */

function joker() {
    strafpunten += 5;
    updateStrafpunten();
    addWordToBoard(currentWord, "green"); 
}

function toonOplossing() {
    strafpunten += 10;
    updateStrafpunten();
    addWordToBoard(currentWord, "red");
}


/* ------------------------------------------------------------
   12. TOPSCORE (optie A)
   ------------------------------------------------------------ */

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
   13. EINDE SPEL
   ------------------------------------------------------------ */

function endGame() {
    clearInterval(timerInterval);
    updateTopScoreIfNeeded();
    startFireworks();
}


/* ------------------------------------------------------------
   14. HIGHLIGHT HELPERS
   ------------------------------------------------------------ */

function highlight(r, c) {
    const cell = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
    if (cell) cell.classList.add("selected");
}

function clearHighlights() {
    document.querySelectorAll(".cell").forEach(c => c.classList.remove("selected"));
}

/* =========================
   . MESSAGE / MODAL UI
   ========================= */

function showMessage(text, extraHTML = "") {
  const bar = document.getElementById("messageBar");
  const msg = document.getElementById("messageText");
  const extra = document.getElementById("messageExtra");

  bar.style.display = "flex";
  msg.textContent = text;
  extra.innerHTML = extraHTML;
}

function clearMessage() {
  showMessage(t("defaultMessage"));
}

function openModal(contentHTML) {
  document.getElementById("modalBody").innerHTML = contentHTML;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

/* ------------------------------------------------------------
   15. INIT
   ------------------------------------------------------------ */

window.addEventListener("DOMContentLoaded", async () => {
    console.log("10letterwoord engine gestart…");

    await laadWoorden();
    console.log("Woorden geladen:", woordPool.length);

    startGame();
});
