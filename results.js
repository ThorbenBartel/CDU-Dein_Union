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
    } else {
        // Filterung der Vereinigungen basierend auf den Benutzerdaten
        vereinigungen = vereinigungen.filter(vereinigung => {
            let include = true;

            // Geschlechtsbasierte Filterung
            if (gender === 'männlich' && vereinigung.name === 'Frauen Union') {
                include = false;
            }

            // Statusbasierte Filterung
            const statusesToExcludeRCDS = ['Schüler', 'Auszubildender'];
            if (statusesToExcludeRCDS.includes(userStatus) && vereinigung.name === 'RCDS') {
                include = false;
            }

            // Altersbasierte Filterung
            if (alter !== null) {
                if (vereinigung.name === 'SU ' && !(alter >= 12 && alter <= 24)) {
                    include = false;
                }
                if ((vereinigung.name === 'JU' || vereinigung.name === 'RCDS') && !(alter >= 16 && alter <= 35)) {
                    include = false;
                }
                if (vereinigung.name === 'SU' && alter < 60) {
                    include = false;
                }
                if ((vereinigung.name === 'CDA' || vereinigung.name === 'KPV' || vereinigung.name === 'MIT' || vereinigung.name === 'OMV' || vereinigung.name === 'SU' || vereinigung.name === 'EKA' || vereinigung.name === 'LSU') && alter < 18) {
                    include = false;
                }
            }

            return include;
        });
    }

    // Überprüfen, ob noch Vereinigungen vorhanden sind
    if (vereinigungen.length === 0) {
        document.getElementById('ergebnistext').innerHTML = "Es wurden keine passenden Vereinigungen gefunden oder sie sind noch zu jung für die Union.";
        return;
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
                        zeigeErgebnis(vereinigungen, stadt, veranstaltungenData);
                    })
                    .catch(error => console.error('Fehler beim Laden der Veranstaltungsdaten:', error));
            } else {
                console.log('Keine Stadt zur Postleitzahl gefunden.');
            }
        })
        .catch(error => console.error('Fehler beim Laden der PLZ-Daten:', error));

    // Ergebnisse und Veranstaltungen anzeigen
    function zeigeErgebnis(vereinigungen, stadt, veranstaltungen) {
        const maxPunkte = vereinigungen.reduce((max, v) => Math.max(max, v.punkte), 0);

        // Sortiere Vereinigungen nach Punktzahl, absteigend
        vereinigungen.sort((a, b) => b.punkte - a.punkte);

        let ergebnisText = "Die Vereinigung(en), die am besten zu dir passen:<br><br>";

        vereinigungen.forEach((vereinigung) => {
            const prozent = ((vereinigung.punkte / maxPunkte) * 100).toFixed(1);

            ergebnisText += `
                <div class="ergebnis-item">
                <details>
                    <summary>
                    <div class="ergebnis-name"><strong>${vereinigung.langName}</strong></div>
                    <div class="ergebnis-bar">
                    <div class="ergebnis-fill" style="width: ${prozent}%"></div>
                    </div>
                    <div class="ergebnis-prozent"><strong>${prozent}%</strong></div>
                    </summary>
                    <div class="details-content">
                    <p><strong>Beschreibung:</strong> ${vereinigung.beschreibung ? vereinigung.beschreibung : 'Keine Beschreibung vorhanden'}</p>
                    <button class="full-width-button" onclick="window.open('${vereinigung.website}', '_blank')">Mitglied werden</button>
            `;
            
            // Füge Hinweis und Veranstaltungen hinzu, wenn vorhanden
            const vereinigungVeranstaltungen = veranstaltungen[stadt]?.[vereinigung.name] || [];
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
        });

        document.getElementById('ergebnistext').innerHTML = ergebnisText;
    }
})();