/* ------------------------------------------------------------
   1. CONFIG & STATE
   ------------------------------------------------------------ */

const WORD_LENGTH = 10;
const TOTAL_ROUNDS = 11;

let debugVisible = false;

/*DEBUGGER*/
function toggleDebug() {
    debugVisible = !debugVisible;
    document.getElementById("debugPanel").style.display = debugVisible ? "block" : "none";
    if (debugVisible) updateDebugPanel();
}
function updateDebugPanel() {
    if (!debugVisible) return;

    const panel = document.getElementById("debugPanel");

    panel.innerHTML = `
        <b>DEBUG</b><br>
        round: ${round}<br>
        strafpunten: ${strafpunten}<br>
        seconden: ${seconden}<br>
        timerGestart: ${timerGestart}<br>
        longPressCount: ${longPressCount}<br>
        topScore: ${topScore}<br>
        currentWord: ${currentWord}<br>
        gridTop: ${grid[0].join("")}<br>
        gridBottom: ${grid[1].join("")}<br>
        currentLanguage: ${currentLang}<br>
        foundWords: ${foundWords.length}<br>
    `;
}


let woordPool = [];
let bag = null;

let foundWords = [];
let currentWord = "";
let grid = [[], []]; // 2 rijen × 10 kolommen

let round = 1;
let strafpunten = 0;
let seconden = 0;

let timerGestart = false;
let timerInterval = null;
let minutePenaltyTimer = null;

let selected = null;
let score = 0; // niet gebruikt voor UI, maar laten staan voor toekomst
let topScore = null; // laagste strafpunten ooit (globale topscore)

let woordIsCorrect = false;
let hintCells = Array(WORD_LENGTH).fill(false);
let longPressCount = 0;
const MAX_LONGPRESSES = 2;

let currentLanguage = "nl";

let saveScheduled = false;

function scheduleSave() {
    if (saveScheduled) return;
    saveScheduled = true;

    setTimeout(() => {
        saveGame();
        saveScheduled = false;
    }, 200);
}

function getLang() {
    return currentLanguage;
}

function t(key) {
    return i18n.translations[i18n.currentLang][key] || key;
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
    const lang = currentLanguage;
    const bestand = lang === "nl" ? "woorden.txt" : `woorden_${lang}.txt`;

    const res = await fetch(bestand);
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

async function startRonde() {

    if (round > 10) return;

    currentWord = kiesNieuwWoord();
    const solutionWord = currentWord.split("");

    hintCells = Array(WORD_LENGTH).fill(false);

    // GRID VULLEN (maar nog niet tonen)
    const shuffled = fisherYatesShuffle(solutionWord.slice());
    grid = [
        shuffled,
        Array(WORD_LENGTH).fill("")
    ];

    const gridEl = document.getElementById("grid");
    gridEl.classList.add("grid-hidden");

    renderGrid(); // cellen zichtbaar, letters verborgen

    await startLetterFlyAnimation();

    gridEl.classList.remove("grid-hidden");

    scheduleSave();
    updateDebugPanel();
}


async function startGame() {
    const loaded = loadGame();

    if (!loaded) {
        round = 1;  
        strafpunten = 0;
        seconden = 0;
        timerGestart = false;
        clearInterval(timerInterval);
        clearInterval(minutePenaltyTimer);
        updateStrafpunten();
        updateTimerDisplay();
        updateTopScoreDisplay();
		grid.innerHTML = "";

        startRonde();
    }
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
    scheduleSave();

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

            // --- NIEUW: letter in een span ---
            const span = document.createElement("span");
            span.className = "cell-letter";
            span.textContent = grid[r][c] || "";
            cell.appendChild(span);

            // --- hint logica ---
            if (r === 1 && hintCells[c] && grid[1][c] !== "") {
                cell.classList.add("hint");
            }

            // --- Pointer-based input ---
            let pressTimer = null;
            let longPressTriggered = false;
            let startX = 0;
            let startY = 0;

            cell.onpointerdown = (e) => {
                longPressTriggered = false;

                pressTimer = setTimeout(() => {
                    longPressTriggered = true;
                    onLongPress(r, c);
                }, 600);

                startX = e.clientX;
                startY = e.clientY;
            };

            cell.onpointermove = (e) => {
                if (!pressTimer) return;

                const dx = Math.abs(e.clientX - startX);
                const dy = Math.abs(e.clientY - startY);

                if (dx > 5 || dy > 5) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
            };

            cell.onpointerup = () => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }

                if (longPressTriggered) return;

                handleCellClick(r, c);
                scheduleSave();
                clearMessage();
            };

            row.appendChild(cell);
        }

        el.appendChild(row);
    }
}


/* ------------------------------------------------------------
   6. SWAP LOGICA
   ------------------------------------------------------------ */

function handleCellClick(r, c) {
    if (r === 1 && hintCells[c]) return;

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

    if (!timerGestart) {
        startTimerIfNeeded();
    }

    if (a === "" && b !== "") return;

    if ((r1 === 1 && hintCells[c1]) || (r2 === 1 && hintCells[c2])) return;

    grid[r1][c1] = b;
    grid[r2][c2] = a;

    renderGrid();
    scheduleSave();
	updateDebugPanel();

}

/* ------------------------------------------------------------
   7. CHECK SOLVED
   ------------------------------------------------------------ */

function checkSolved() {
    const bottom = grid[1].join("");


    if (bottom === currentWord) {
        addWordToBoard(currentWord, "green");
		round++;
        scheduleSave();
		longPressCount = 0;
        startRonde();
    }
	    checkEindeSpel();
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
    scheduleSave();
	
    startRonde();
}

/* ------------------------------------------------------------
   8. MESSAGE / MODAL UI
   ------------------------------------------------------------ */

function showMessage(text, html = "", callback = null) {
    const textBox = document.getElementById("messageText");
    const extraBox = document.getElementById("messageExtra");

    if (textBox) textBox.innerHTML = text;

    if (extraBox) {
        extraBox.innerHTML = html;
        extraBox.style.display = html ? "block" : "none";
    }

    if (callback) {
        setTimeout(callback, 0);
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
            <button id="jaBtn" class="btn btn-green">Ja</button>
            <button id="neeBtn" class="btn btn-red">Nee</button>
        </div>
        `,
        () => {
            document.getElementById("jaBtn").onclick = () => {
                updateTopScoreDisplay();
                startNewGame();
                showMessage(t("defaultMessage"));
            };

            document.getElementById("neeBtn").onclick = () => {
                showMessage(t("defaultMessage"));
            };
        }
    );
}

function startNewGame() {
    const boardEl = document.getElementById("board");
    boardEl.innerHTML = "";

    foundWords = [];
    round = 1;
    strafpunten = 0;
    seconden = 0;
    longPressCount = 0;
    hintCells = Array(WORD_LENGTH).fill(false);

    timerGestart = false;
    clearInterval(timerInterval);
    clearInterval(minutePenaltyTimer);
    timerInterval = null;
    minutePenaltyTimer = null;

    localStorage.removeItem("letterswap_save");

    updateStrafpunten();
    updateTimerDisplay();
    updateTopScoreDisplay();

    startRonde();

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

/* ------------------------------------------------------------
   9. HINT
   ------------------------------------------------------------ */

function geefHint(r, c) {
    const letter = grid[r][c];
    if (!letter) return;

    let correctPos = -1;
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (currentWord[i] === letter && !hintCells[i]) {
            correctPos = i;
            break;
        }
    }

    if (correctPos === -1) return;

    if (grid[1][correctPos] === letter) return;

    const existing = grid[1][correctPos];

    if (existing !== "") {
        grid[r][c] = existing;
    } else {
        grid[r][c] = "";
    }

    grid[1][correctPos] = letter;
    hintCells[correctPos] = true;

    renderGrid();
    scheduleSave();
}

/* ------------------------------------------------------------
   10. BOARD
   ------------------------------------------------------------ */

function addWordToBoard(word, color = "green") {
    foundWords.push({ word, color });
    scheduleSave();

    const board = document.getElementById("board");
    const div = document.createElement("div");
    div.className = "board-word " + color;
    div.textContent = word;
    board.appendChild(div);
}

function renderBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";

    for (const item of foundWords) {
        const div = document.createElement("div");
        div.className = "board-word " + item.color;
        div.textContent = item.word;
        board.appendChild(div);
    }
}

/* ------------------------------------------------------------
   11. TIMER
   ------------------------------------------------------------ */

function startMinutePenaltyTimer() {
    if (minutePenaltyTimer) return;

    minutePenaltyTimer = setInterval(() => {
        strafpunten++;
        updateStrafpunten();
        scheduleSave();
    }, 60000);
}

function startTimerIfNeeded() {
    if (timerGestart) return;

    timerGestart = true;

    timerInterval = setInterval(() => {
        seconden++;
        updateTimerDisplay();
        scheduleSave();
    }, 1000);

    startMinutePenaltyTimer();
}

function updateTimerDisplay() {
    const m = Math.floor(seconden / 60).toString().padStart(2, "0");
    const s = (seconden % 60).toString().padStart(2, "0");

    document.getElementById("Timer").textContent = "T: " + m + ":" + s;
	updateDebugPanel();

}

/* ------------------------------------------------------------
   12. TAAL
   ------------------------------------------------------------ */

function openTaalKeuze() {
    showMessage(
        t("language"),
        `
      <div class="lang-select">
        <button data-lang="nl"><img src="images/NL.png" alt="NL"></button>
        <button data-lang="fr"><img src="images/FR.png" alt="FR"></button>
        <button data-lang="en"><img src="images/EN.png" alt="EN"></button>
        <button data-lang="de"><img src="images/DE.png" alt="DE"></button>
      </div>
      `
    );

    document.querySelectorAll(".lang-select button").forEach(btn => {
        btn.onclick = async () => {
            await switchLanguage(btn.dataset.lang);
            clearMessage();
        };
    });
}

async function switchLanguage(langCode) {
    currentLanguage = langCode;
    i18n.setLanguage(langCode);

    const img = document.querySelector("#langBtn img");
    if (img) img.src = `images/${langCode.toUpperCase()}.png`;

    await laadWoorden();

    // nieuw spel in nieuwe taal
    startNewGame();
}



/* ------------------------------------------------------------
   13. STRAFPUNTEN / SCORE
   ------------------------------------------------------------ */

function updateStrafpunten() {
    document.getElementById("Faults").textContent = "Strafpt'n: " + strafpunten;
updateDebugPanel();

}

function loadTopScore() {
    const saved = localStorage.getItem("letterswap_topScore");
    topScore = saved ? Number(saved) : null;
    updateTopScoreDisplay();
}

function saveTopScore() {
    if (topScore === null) return;
    localStorage.setItem("letterswap_topScore", topScore);
}

function confirmResetTopScore() {
    showMessage(
        "Topscore resetten?",
        `
        <div class="confirm-box">
            <button id="jaBtn" class="btn btn-green">Ja</button>
            <button id="neeBtn" class="btn btn-red">Nee</button>
        </div>
        `,
        () => {
            document.getElementById("jaBtn").onclick = () => {
                localStorage.removeItem("letterswap_topScore");
                topScore = null;
                updateTopScoreDisplay();
                showMessage(t("defaultMessage"));
            };

            document.getElementById("neeBtn").onclick = () => {
                showMessage(t("defaultMessage"));
            };
        }
    );
}

function updateTopScoreDisplay() {
    const uiSpan = document.getElementById("Topscore");
    if (!uiSpan) return;

    const value = topScore === null ? "-" : topScore;
    uiSpan.textContent = "Topscore: " + value;
}

function updateTopScoreIfNeeded() {
    if (topScore === null || strafpunten < topScore) {
        topScore = strafpunten;
        saveTopScore();
        updateTopScoreDisplay();
    }
}

/* ------------------------------------------------------------
   14. JOKER & OPLOSSING
   ------------------------------------------------------------ */

function joker() {
	
    strafpunten += 5;
    longPressCount = 0;
    updateStrafpunten();
    scheduleSave();
}

function toonOplossing() {
    strafpunten += 10;
    updateStrafpunten();
       round++;
	longPressCount = 0;
    checkEindeSpel();

    addWordToBoard(currentWord, "red");

    if (bag && bag.cooldown) {
        bag.cooldown.set(currentWord, bag.cooldownShuffles);
        bag.refill();
    }

    woordIsCorrect = false;
    scheduleSave();
    startRonde();
}

/* ------------------------------------------------------------
   15. EINDE SPEL
   ------------------------------------------------------------ */

function checkEindeSpel() {
    if (round >= TOTAL_ROUNDS) {
        endGame();
    }
}

function colorFullWordGreen() {
    document.querySelectorAll('#grid .cell').forEach(tile => {
        tile.classList.add('fullgreen');
    });
}

function endGame() {
    clearInterval(timerInterval);
    clearInterval(minutePenaltyTimer);
    timerInterval = null;
    minutePenaltyTimer = null;
    timerGestart = false;

    updateTopScoreIfNeeded();

    startFireworks();

}

/* ------------------------------------------------------------
   16. SAVE / LOAD
   ------------------------------------------------------------ */

function saveGame() {
    const data = {
        grid,
        currentWord,
        round,
        strafpunten,
        seconden,
        longPressCount,
        currentLanguage,
        hintCells,
        foundWords,
        topScore
    };

    localStorage.setItem("letterswap_save", JSON.stringify(data));
}

function loadGame() {
    const saved = localStorage.getItem("letterswap_save");
    if (!saved) return false;

    const game = JSON.parse(saved);

    grid = game.grid;
    currentWord = game.currentWord;
    round = game.round;
    strafpunten = game.strafpunten ?? 0;
    seconden = game.seconden ?? 0;
    longPressCount = game.longPressCount ?? 0;
    currentLanguage = game.currentLanguage || "nl";
    hintCells = game.hintCells || Array(WORD_LENGTH).fill(false);
    foundWords = game.foundWords || [];
    if (game.topScore !== undefined && game.topScore !== null) {
        topScore = game.topScore;
    }

    renderGrid();
    renderBoard();
    updateStrafpunten();
    updateTimerDisplay();
    updateTopScoreDisplay();

    timerGestart = false;
    clearInterval(timerInterval);
    clearInterval(minutePenaltyTimer);
    timerInterval = null;
    minutePenaltyTimer = null;
updateDebugPanel();

    return true;
}

/* ------------------------------------------------------------
   17. HIGHLIGHT HELPERS
   ------------------------------------------------------------ */

function highlight(r, c) {
    const cell = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
    if (cell) cell.classList.add("selected");
}

function clearHighlights() {
    document.querySelectorAll(".cell").forEach(c => c.classList.remove("selected"));
}

/* ------------------------------------------------------------
   18. VUURWERK
   ------------------------------------------------------------ */

function startFireworks(done) {

    const canvas = document.getElementById("fireworksCanvas");
    const ctx = canvas.getContext("2d");

    canvas.classList.remove("hidden");
    canvas.style.display = "block";
    canvas.style.background = "rgba(0,0,0,0.95)";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    let running = true;

    function hslToRgba(h, s, l, a) {
        s /= 100;
        l /= 100;

        const k = n => (n + h / 30) % 12;
        const f = n =>
            l - s * Math.min(l, 1 - l) *
            Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

        return `rgba(${Math.round(255 * f(0))}, ${Math.round(255 * f(8))}, ${Math.round(255 * f(4))}, ${a})`;
    }

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
            canvas.classList.add("hidden");
            canvas.style.display = "none";
            canvas.style.background = "transparent";

            if (done) done();
        }
    }

    let count = 1;
    const interval = setInterval(() => {
        createExplosion();
        count++;
        if (count >= 8) {
            clearInterval(interval);
            setTimeout(() => (running = false), 2000);
        }
    }, 300);

	nieuwSpel()
		grid.innerHTML = "";

		renderGrid();	
		update();
	
}

/* ------------------------------------------------------------
   19. INIT
   ------------------------------------------------------------ */

document.getElementById("jokerBtn").addEventListener("click", () => {
    nieuwWoord();
});
document.getElementById("newGameBtn").addEventListener("click", nieuwSpel);
document.getElementById("solutionBtn").addEventListener("click", toonOplossing);
document.getElementById("langBtn").addEventListener("click", openTaalKeuze);
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("Topscore").addEventListener("dblclick", confirmResetTopScore);

window.addEventListener("DOMContentLoaded", async () => {
    await laadWoorden();
    loadTopScore();
    startGame();
});

/*DEBUGGER*/

window.addEventListener("keydown", (e) => {
    if (e.key === "d" || e.key === "D") {
        toggleDebug();
    }
});


function positionOverlay() {
    const board = document.getElementById("board"); // jouw lettervlak
    const rect = board.getBoundingClientRect();

    const overlay = document.getElementById("letterFlyOverlay");
    overlay.style.position = "absolute";
    overlay.style.top = rect.top + "px";
    overlay.style.left = rect.left + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
}
function randomStartPos() {
    const board = document.getElementById("board");
    const rect = board.getBoundingClientRect();

    return {
        x: Math.random() * rect.width,
        y: Math.random() * rect.height
    };
}

function getCellPos(cell) {
    const rect = cell.getBoundingClientRect();
    const boardRect = document.getElementById("board").getBoundingClientRect();

    return {
        x: rect.left - boardRect.left,
        y: rect.top - boardRect.top,
        w: rect.width,
        h: rect.height
    };
}


async function startLetterFlyAnimation() {
    positionOverlay();

    const overlay = document.getElementById("letterFlyOverlay");
    overlay.innerHTML = "";

    const cells = [...document.querySelectorAll(".cell")];
    const topRow = cells.slice(0, 10);

    const letters = topRow.map(cell => {
        const target = getCellPos(cell);
        const start = randomStartPos();

        return {
            letter: cell.textContent.trim(),
            start,
            target
        };
    });

    const shuffled = letters.sort(() => Math.random() - 0.5);

for (let i = 0; i < shuffled.length; i++) {
    const l = shuffled[i];

    const el = document.createElement("div");
    el.className = "fly-letter";
    el.textContent = l.letter;

    // eindpositie (anker)
    el.style.left = l.start.x + "px";
    el.style.top = l.start.y + "px";

    overlay.appendChild(el);

    // STARTPOSITIE instellen (lager of hoger)
    el.style.transform = "translate(0, 90px)"; // <— pas deze aan

    // force reflow zodat de transition werkt
    void el.offsetWidth;

    // lettergrootte meten
    const letterRect = el.getBoundingClientRect();

    // exacte gecentreerde eindpositie
    const dx = (l.target.x + l.target.w / 2) - (letterRect.width / 2) - l.start.x;
    const dy = (l.target.y + l.target.h / 2) - (letterRect.height / 2) - l.start.y;

    el.style.opacity = 1;
    el.style.transform = `translate(${dx}px, ${dy}px)`; // eindpositie

    await new Promise(res => setTimeout(res, 120));
}


    await new Promise(res => setTimeout(res, 600));
    overlay.innerHTML = "";
}






