// ===============================
//  i18n.js — Letterswap Taalmodule
// ===============================

// ---- 1. Translation map ----
const translations = {
  nl: {
	
    time: "Tijd",
    Points: "Score",
    top: "Topscore",
	hints: "Max aantal toegelaten hints is bereikt!", 
    language: "Kies een taal.", 
    confirmNewGame: "Wil je een nieuw spel?",
    confirmYes: "Ja",
    confirmNo: "Neen",
    defaultMessage: "Hoe speel je dit spel ?  → Klik op info.",
	
    modalInfoTitle: "Hoe speel je dit spel?",
    modalInfoBody: `• Ieder spel is altijd oplosbaar.<br>
	• Vorm met de letters uit de bovenste rij een woord van 10 letters in de onderste.<br>
	• Klik op een letter en wissel die van plaats.<br>
	• Hou een letter even ingedrukt voor een hint. Die letter wordt dan op de correcte positie gezet.<br>
	• De Joker geeft U een vervangwoord.<br><br>
	- 1 strafpunt per minuut speeltijd.<br>
	- 2 strafpunt per hint.<br>
	- 5 strafpunten per Joker.<br>
	- 10 strafpunten gevraagde "oplossing".<br><br>
	* Reset de topscore door erop te dubbelklikken !<br><br>

	Belangrijk:<br>
	Er worden geen meervouden, verkleinwoorden of vervoegingen gebruikt.
`
  },

  en: {
     
    time: "Time",
    Points: "Pts",
    top: "Top",
    hints: "You have reached the max. hints!",
    language: "Language",
    confirmNewGame: "Do you want a restart?",
    confirmYes: "Yes",
    confirmNo: "No",
    defaultMessage: "How to play?  → Click info.",
    modalInfoTitle: "How to play this game?",
    modalInfoBody: `
	• Every puzzle is always solvable.<br>
	• Form 10 horizontal words of 10 letters.<br>
	• Click two letters to swap them.<br>
	• Green letters are already correct and cannot be moved.<br>
	• Hold a letter briefly to get a hint.<br>
	• That letter becomes an extra green tile.<br>
	• Green letters are fixed and correct.<br><br>

	• 1 penalty point per swap.<br>
	• 10 penalty points per hint.<br><br>

	Important:<br>
	Plural forms, diminutives and verb conjugations are not used.
`
  },

  fr: {
  
    time: "Temps",
    Points: "Pts",
    top: "Top",
	hints: "Vous avez attaignez le max. d' aides ",
    language: "Langue",
    confirmNewGame: "Voulez-vous recommencer?",
    confirmYes: "Oui",
    confirmNo: "Non",
    defaultMessage: "Comment jouer?  →  Cliquez sur info.",
    modalInfoTitle: "Comment jouer ce jeu?",
    modalInfoBody:`
	• Chaque puzzle est toujours solvable.<br>
	• Formez 10 mots horizontaux de 10 lettres.<br>
	• Cliquez sur deux lettres pour les échanger.<br>
	• Les lettres vertes sont déjà correctes et ne peuvent plus bouger.<br>
	• Maintenez une lettre un instant pour obtenir un indice.<br>
	• Cette lettre devient alors une tuile verte supplémentaire.<br>
	• Les lettres vertes sont fixes et correctes.<br><br>

	• 1 point de pénalité par échange.<br>
	• 10 points de pénalité par indice.<br><br>

	Important:<br>
	Pas de pluriels, diminutifs ou conjugaisons.
	`
  },

  de: {

    time: "Zeit",
    points: "Pkt",
    top: "Top",
	hints: "Se haben das max. Hilfe erreicht!",
    language: "Sprache",
    confirmNewGame: "Möchten Sie ein neues Spiel?",
    confirmYes: "Ja",
    confirmNo: "Nein",
    defaultMessage: "Wie spielt man das?  →  Klicken Sie auf Info.",
    modalInfoTitle: "Wie spielt man das?",
    modalInfoBody: `
	• Jedes Puzzle ist immer lösbar.<br>
	• Bilden Sie 10 horizontale Wörter mit 10 Buchstaben.<br>
	• Klicken Sie zwei Buchstaben an, um sie zu tauschen.<br>
	• Grüne Buchstaben sind bereits korrekt und können nicht bewegt werden.<br>
	• Halten Sie einen Buchstaben kurz gedrückt für einen Hinweis.<br>
	• Dieser Buchstabe wird dann ein zusätzliches grünes Feld.<br>
	• Grüne Buchstaben sind fest und korrekt.<br><br>

	• 1 Strafpunkt pro Tausch.<br>
	• 10 Strafpunkte pro Hinweis.<br><br>

	Wichtig:<br>
	Keine Pluralformen, Verkleinerungen oder Verbformen.
`
  }
};

// ---- 2. Current language ----
let currentLang = localStorage.getItem("lang") || "nl";

// ---- 3. Apply translations ----
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const value = translations[currentLang][key];

    if (!value) {
      console.warn(`Missing translation for key '${key}' in '${currentLang}'`);
      return;
    }

    if (!el.hasAttribute("data-i18n-html")) {
      el.textContent = value;
    } else {
      el.innerHTML = value;
    }
  });
  // Update vlag in toolbar2
	const langImg = document.querySelector("#langBtn img");
	if (langImg) {
		langImg.src = `images/${currentLang.toUpperCase()}.png`;
}

}
// After applying normal translations
const msg = document.getElementById("messageText");
if (msg && msg.textContent.trim() === "") {
    msg.textContent = translations[currentLang].defaultMessage;
}


// ---- 4. Change language ----
function setLanguage(lang) {
  if (!translations[lang]) return;

  currentLang = lang;
  window.i18n.currentLang = lang;   // ← BELANGRIJK

  localStorage.setItem("lang", lang);
  applyTranslations();
}


// ---- 5. Initialize on load ----
document.addEventListener("DOMContentLoaded", applyTranslations);

window.i18n = {
  currentLang,
  translations,
  setLanguage,
  applyTranslations
};


// ---- 6. Export ----
window.i18n = {
  get currentLang() { return currentLang; },
  translations,
  setLanguage,
  applyTranslations
};
window.i18n = {
  get currentLang() { return currentLang; },
  translations,
  setLanguage,
  applyTranslations
};

