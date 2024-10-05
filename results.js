(function() {
    // Vereinigungen aus localStorage holen
    let vereinigungen = JSON.parse(localStorage.getItem('vereinigungen')) || [];

    // Benutzerdaten aus localStorage holen
    const gender = localStorage.getItem('gender'); // Erwartet 'male' oder 'female'
    const birthdate = localStorage.getItem('birthdate');
    const userStatus = localStorage.getItem('status');
    const evangelisch = localStorage.getItem('evangelisch') === 'true'; // Konvertiere zu boolean
    const lsbtq = localStorage.getItem('lsbtq') === 'true'; // Konvertiere zu boolean
    const postalcode = localStorage.getItem('postalcode');

    // Funktion zur Berechnung des Alters
    function berechneAlter(geburtsdatum) {
        const heute = new Date();
        const geburtstag = new Date(geburtsdatum);
        let alter = heute.getFullYear() - geburtstag.getFullYear();
        const monat = heute.getMonth() - geburtstag.getMonth();
        if (monat < 0 || (monat === 0 && heute.getDate() < geburtstag.getDate())) {
            alter--;
        }
        return alter;
    }

    // Alter des Benutzers berechnen
    let alter = null;
    if (birthdate) {
        alter = berechneAlter(birthdate);
    } else {
        console.error('Kein Geburtsdatum vorhanden oder ungültig');
        alter = null;
    }

    // Filter für Benutzer unter 12 Jahren
    if (alter !== null && alter < 12) {
        vereinigungen = []; // Alle Vereinigungen entfernen
    }

    // Überprüfen, ob noch Vereinigungen vorhanden sind
    if (vereinigungen.length === 0) {
        document.getElementById('ergebnistext').innerHTML = "Es wurden keine passenden Vereinigungen gefunden oder du bist noch zu jung für die Union.";
        return;
    }

    // Speichere eine Kopie aller Vereinigungen für die Berechnungen
    const alleVereinigungenFuerBerechnungen = [...vereinigungen];

    // Für die Anzeige nur die CDU verwenden
    let vereinigungenAnzeigen = vereinigungen.filter(v => v.name === 'CDU');

    // Falls die CDU nicht in der Liste ist, fügen wir sie hinzu
    if (vereinigungenAnzeigen.length === 0) {
        const cduVereinigung = alleVereinigungenFuerBerechnungen.find(v => v.name === 'CDU');
        if (cduVereinigung) {
            vereinigungenAnzeigen.push(cduVereinigung);
        } else {
            console.error('Die Vereinigung CDU wurde nicht gefunden.');
            document.getElementById('ergebnistext').innerHTML = "Es wurden keine passenden Vereinigungen gefunden.";
            return;
        }
    }

    // PLZ zu Stadt zuordnen und Veranstaltungen laden
    fetch('plz_nrw.json')
        .then(response => response.json())
        .then(plzData => {
            const stadt = plzData[postalcode];

            if (stadt) {
                console.log(`Die Stadt zur Postleitzahl ${postalcode} ist ${stadt}`);

                // Veranstaltungen laden
                fetch('veranstaltungen.json')
                    .then(response => response.json())
                    .then(veranstaltungenData => {
                        zeigeErgebnis(vereinigungenAnzeigen, alleVereinigungenFuerBerechnungen, stadt, veranstaltungenData);
                    })
                    .catch(error => console.error('Fehler beim Laden der Veranstaltungsdaten:', error));
            } else {
                console.log('Keine Stadt zur Postleitzahl gefunden.');
                zeigeErgebnis(vereinigungenAnzeigen, alleVereinigungenFuerBerechnungen, null, {});
            }
        })
        .catch(error => console.error('Fehler beim Laden der PLZ-Daten:', error));

    // Ergebnisse und Veranstaltungen anzeigen
    function zeigeErgebnis(vereinigungenAnzeigen, alleVereinigungen, stadt, veranstaltungen) {
        // Berechne die maximale Punktzahl über alle Vereinigungen
        const maxPunkte = alleVereinigungen.reduce((max, v) => Math.max(max, v.punkte), 0);

        // Finde die CDU in den anzuzeigenden Vereinigungen
        const cduVereinigung = vereinigungenAnzeigen.find(v => v.name === 'CDU');

        if (!cduVereinigung) {
            document.getElementById('ergebnistext').innerHTML = "Es wurden keine passenden Vereinigungen gefunden.";
            return;
        }

        // Berechne den Prozentsatz für die CDU
        let prozent = 0;
        if (maxPunkte > 0) {
            prozent = ((cduVereinigung.punkte / maxPunkte) * 100).toFixed(1);
        } else {
            prozent = 100; // Wenn keine Punkte vergeben wurden, setzen wir den Prozentwert auf 100%
        }

        let ergebnisText = "<br><br>";

        ergebnisText += `
            <div class="ergebnis-item">
            <details>
                <summary>
                <div class="ergebnis-name"><strong>${cduVereinigung.langName}</strong></div>
                <div class="ergebnis-bar">
                <div class="ergebnis-fill" style="width: ${prozent}%"></div>
                </div>
                <div class="ergebnis-prozent"><strong>${prozent}%</strong></div>
                </summary>
                <div class="details-content">
                <p><strong>Beschreibung:</strong> ${cduVereinigung.beschreibung ? cduVereinigung.beschreibung : 'Keine Beschreibung vorhanden'}</p>
                <button class="full-width-button" onclick="window.open('${cduVereinigung.website}', '_blank')">Mitglied werden</button>
        `;

        // Füge Hinweis und Veranstaltungen hinzu, wenn vorhanden
        const vereinigungVeranstaltungen = (veranstaltungen[stadt] && veranstaltungen[stadt][cduVereinigung.name]) || [];
        if (vereinigungVeranstaltungen.length > 0) {
            ergebnisText += `
                <div class="trennlinie"></div> <!-- Türkisfarbene Trennlinie -->
                <div class="veranstaltung-hinweis">
                    <h3>Veranstaltungen</h3>
                </div>
            `;

            vereinigungVeranstaltungen.forEach(v => {
                ergebnisText += `
                    <div class="veranstaltung">
                        <h4>${v.name}</h4>
                        <p><strong>Beschreibung:</strong> ${v.beschreibung}</p>
                        <p><strong>Datum:</strong> ${v.datum} um ${v.uhrzeit}</p>
                        <p><strong>Adresse:</strong> ${v.adresse}</p>
                        <p><strong>Anmeldung:</strong> <a href="${v.link}" target="_blank">Hier anmelden</a></p>
                        <p><strong>Hotline:</strong> ${v.hotline}</p>
                    </div>
                `;
            });
        }

        ergebnisText += `
                </div>
            </details>
            </div>
        `;

        document.getElementById('ergebnistext').innerHTML = ergebnisText;
    }
})();
