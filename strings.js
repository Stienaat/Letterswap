// ===============================
//  strings.js — Letterswap Taalmodule
// ===============================

// ---- 1. Translation map ----
const translations = {
  nl: {
	
    time: "Tijd",
    Points: "Score",
    top: "Topscore",
	hints: "Max aantal toegelaten hints is bereikt!",
  
    close: "Sluiten",
    language: "Kies een taal", 
    confirmNewGame: "Wil je een nieuw spel?",
    confirmYes: "Ja",
    confirmNo: "Neen",
    defaultMessage: "Hoe speel je dit ?  → Klik op info.",
	
    modalInfoTitle: "Hoe speel je dit spel?",
    modalInfoBody: `• Ieder spel is altijd oplosbaar.<br>
	• Vorm met de letters uit de bovenste rij een woord van 10 letters in de onderste.<br>
	• Klik op een letter en wissel die van plaats.<br>
	• Hou een letter even ingedrukt voor een hint. Die letter wordt dan op de correcte positie gezet.<br>
	• De Joker geeft U een vervangwoord.<br>
	• 1 strafpunt per minuut speeltijd.<br>
	• 2 strafpunt per hint.<br>
	• 5 strafpunten per Joker.<br>
	• 10 strafpunten getoonde oplossing.<br>
	* Reset de topscore door erop te dubbelklikken !<br>

	Belangrijk:<br>
	Er worden geen meervouden, verkleinwoorden of vervoegingen gebruikt.
`
  },

  en: {
    title: "Letter wissel",
  
    time: "Time",
    points: "Pts",
    top: "Top",
    howToPlay: "How to play?",
    infoHint: " →  Click info.",
    close: "Close",
    language: "Language",
    footer: "© 2026 FS creations. All rights reserved. Not for commercial use.",

    confirmNewGame: "Do you want to start a new game?",
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
    title: "Letter wissel",
    level: "Niv",
    time: "Temps",
    points: "Pts",
    top: "Top",
    howToPlay: "Comment jouer?",
    infoHint: " →  Cliquez sur info.",
    close: "Fermer",
    language: "Langue",
    footer: "© 2026 FS creations. Tous droits réservés. Pas pour un usage commercial.",

    confirmNewGame: "Voulez-vous commencer une nouvelle partie?",
    confirmYes: "Oui",
    confirmNo: "Non",
    defaultMessage: "Comment jouer? Cliquez sur info pour plus d'explications.",
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
    title: "Letter wissel",
    level: "Stufe",
    time: "Zeit",
    points: "Pkt",
    top: "Top",
    howToPlay: "Wie spielt man das?",
    infoHint: "Klicken Sie auf Info für mehr Erklärung.",
    close: "Schließen",
    language: "Sprache",
    footer: "© 2026 FS creations. Alle Rechte vorbehalten. Nicht für kommerzielle Nutzung.",

    confirmNewGame: "Möchten Sie ein neues Spiel starten?",
    confirmYes: "Ja",
    confirmNo: "Nein",
    defaultMessage: "Wie spielt man das? Klicken Sie auf Info für mehr Erklärung.",
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
  localStorage.setItem("lang", lang);
  applyTranslations();
}

// ---- 5. Initialize on load ----
document.addEventListener("DOMContentLoaded", applyTranslations);

// ---- 6. Export ----
window.strings = { setLanguage, applyTranslations, translations };
