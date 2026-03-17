function doPost(e) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var params = e.parameter;

    // --- CAS 1 : Paramètres dans l'URL (Jeux) ---
    if (params && params.action) {
        var action = params.action;

        // 1. FLAPPY CAP (Ajout de score)
        if (action == 'addScore') {
            var sheet = ss.getSheetByName("Leaderboard");
            if (!sheet) sheet = ss.insertSheet("Leaderboard");
            sheet.appendRow([params.name, Number(params.score), new Date()]);
            return ContentService.createTextOutput("Score enregistré");
        }

        // 2. SYMPHONIE DU CAP'TAIN (Nouveau !)
        if (action == 'addRythme') {
            var sheet = ss.getSheetByName("Rythme");
            if (!sheet) sheet = ss.insertSheet("Rythme");
            sheet.appendRow([params.name, Number(params.score), new Date()]);
            return ContentService.createTextOutput("Succès Concert enregistré");
        }

        // 3. 2048 CAP'ICAM (Scores classiques)
        if (action == 'addPuzzleScore') {
            var sheet = ss.getSheetByName("Scores2048");
            if (!sheet) sheet = ss.insertSheet("Scores2048");
            sheet.appendRow([params.name, Number(params.score), new Date()]);
            return ContentService.createTextOutput("Score 2048 enregistré");
        }

        // 4. 2048 CAP'ICAM (Victoire 2048)
        if (action == 'addPuzzleWin') {
            var sheet = ss.getSheetByName("Gagnants2048");
            if (!sheet) sheet = ss.insertSheet("Gagnants2048");
            sheet.appendRow([params.name, new Date()]);
            return ContentService.createTextOutput("Victoire 2048 enregistrée");
        }
    }

    // --- CAS 2 : Données JSON (Commandes Rallyes) ---
    if (e.postData && e.postData.contents) {
        try {
            var data = JSON.parse(e.postData.contents);
            var sheet = ss.getSheetByName("Commandes");
            if (!sheet) sheet = ss.insertSheet("Commandes");

            sheet.appendRow([
                new Date(),
                data.rallye,
                data.name,
                data.location,
                data.phone,
                data.notes
            ]);
            return ContentService.createTextOutput("Commande reçue");
        } catch (err) { }
    }

    return ContentService.createTextOutput("Rien à faire");
}

function doGet(e) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Leaderboard");
    var topScores = [];

    if (sheet) {
        var data = sheet.getDataRange().getValues();
        if (data.length > 1) {
            var scores = [];
            for (var i = 1; i < data.length; i++) {
                scores.push({ name: data[i][0], score: Number(data[i][1]) });
            }
            scores.sort(function (a, b) { return b.score - a.score; });
            topScores = scores.slice(0, 3);
        }
    }

    return ContentService.createTextOutput(JSON.stringify(topScores))
        .setMimeType(ContentService.MimeType.JSON);
}
