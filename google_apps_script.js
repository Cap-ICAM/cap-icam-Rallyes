function doPost(e) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- CAS 1 : Paramètres dans l'URL (Jeux) ---
    if (e.parameter && e.parameter.action) {
        var action = e.parameter.action;

        // 1. FLAPPY CAP (Ajout de score)
        if (action == 'addScore') {
            var sheet = ss.getSheetByName("Leaderboard");
            if (!sheet) sheet = ss.insertSheet("Leaderboard"); // Crée l'onglet s'il n'existe pas

            // Colonnes : Nom, Score, Date
            sheet.appendRow([e.parameter.name, Number(e.parameter.score), new Date()]);
            return ContentService.createTextOutput("Score Flappy enregistré");
        }

        // 2. SYMPHONIE DU CAP'TAIN (Nouveau !)
        if (action == 'addRythme') {
            var sheet = ss.getSheetByName("Rythme");
            if (!sheet) sheet = ss.insertSheet("Rythme"); // Crée l'onglet s'il n'existe pas

            // Colonnes : Nom, Score, Date
            sheet.appendRow([e.parameter.name, Number(e.parameter.score), new Date()]);
            return ContentService.createTextOutput("Succès Concert enregistré");
        }
    }

    // --- CAS 2 : Données JSON (Commandes Rallyes) ---
    if (e.postData && e.postData.contents) {
        try {
            var data = JSON.parse(e.postData.contents);
            var sheet = ss.getSheetByName("Commandes");
            if (!sheet) sheet = ss.insertSheet("Commandes");

            // Ajoute la commande : Date, Rallye, Nom, Lieu, Tel, Notes
            sheet.appendRow([
                new Date(),
                data.rallye,
                data.name,
                data.location,
                data.phone,
                data.notes
            ]);
            return ContentService.createTextOutput("Commande reçue");
        } catch (err) {
            // Ignore les erreurs de parsing si ce n'est pas du JSON valide
        }
    }

    return ContentService.createTextOutput("Rien à faire");
}

function doGet(e) {
    // Cette fonction sert uniquement à récupérer le CLASSEMENT pour FlappyCap
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Leaderboard");

    var topScores = [];

    if (sheet) {
        var data = sheet.getDataRange().getValues();
        // On suppose que la ligne 1 contient les titres, on commence ligne 2
        // Si pas de titres, changez 1 en 0
        if (data.length > 1) {
            // On récupère toutes les lignes de données
            var scores = [];
            for (var i = 1; i < data.length; i++) {
                scores.push({ name: data[i][0], score: Number(data[i][1]) });
            }

            // Tri les scores du plus grand au plus petit
            scores.sort(function (a, b) { return b.score - a.score; });

            // Garde uniquement le TOP 3
            topScores = scores.slice(0, 3);
        }
    }

    // Renvoie le résultat en JSON pour le site
    return ContentService.createTextOutput(JSON.stringify(topScores))
        .setMimeType(ContentService.MimeType.JSON);
}
