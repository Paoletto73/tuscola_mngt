
function elencoEventi(testoRicerca) {
    // chiama l'endpoint api per fare il retrive delle informazioni di tutti gli eventi caricati a sistema dalla data di oggi in poi
    // oppure degli eventi che hanno un testo specifico

    // Costruire l'URL con il parametro di ricerca
    const urlEndP = new URL('http://localhost:5000/eventi');
    
    // Inserisci il parametro di ricerca nell'url dell'endpoint
    if (testoRicerca) {
        urlEndP.searchParams.append('Titolo', testoRicerca);
    }    

    fetch(urlEndP, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })

    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('container-eventi');
        container.innerHTML = '';
        // costruisci il mosaico nella pagina principale con il risultato del json
        data.forEach(evento => {
            const vDiv = document.createElement('div');
            vDiv.classList.add('col-sm-6','col-lg-4','mb-4');
            vDiv.innerHTML = `
                <div class="card">
                    <a class="card-block stretched-link text-decoration-none" href="javascript:void(0);" onclick="openPageDettaglio(${evento.id})">
                        <img src="img/${evento.imglink}" class="card-img-top" >
                        <div class="card-body">
                            <h5 class="card-title">${evento.titolo}</h5>
                            <h5 class="card-title">${giornoSettimana(evento.dataEvento)}</h5>
                            <h5 class="card-title">${evento.dataEvento} Ora: ${evento.strOraEvento}</h5>
                            <p class="card-text"><small class="text-body-secondary">Prezzo Euro: ${evento.prezzo} - Numero Posti: ${evento.strNumeroPosti}</small></p>
                        </div>
                    </a>
                </div>
            `;
            container.appendChild(vDiv);
        });
    })
    .catch(error => {
        console.error('Errore nel recupero degli eventi in programma. Errore :', error);
    });
}

function dettaglioEvento(idEvento) {
    const idUtente = sessionStorage.getItem('idUser');
    idPrenotazione = 0
    numeroPrenotati = 0
    note = ""

    // se l'utente e' loggato al sistema verifico se esite gia' una prenotazione per lui per questo evento
    if (idUtente) {

        // chiamo l'endpoint api per verificate se esiste gia' una prenotazione per questo utente/user
        const urlEndPV = new URL('http://localhost:5000/prenotazione');
        
        // Inserisci l'idevento nell'url dell'endpoint
        urlEndPV.searchParams.append('idUtente', idUtente);
        urlEndPV.searchParams.append('idEvento', idEvento);

        fetch(urlEndPV, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })

        .then(response => response.json())
        .then(data => {
            if (data.idPrenotazione) {
                idPrenotazione = data.idPrenotazione
                numeroPrenotati = data.numeroPrenotati
                note = data.noteEvento
            }
        })
        .catch(error => {
            // l'endpoint restituisce un errore generico per la verifica della prenotazione
            console.error('Errore nella verifica prenotazione', error);
        });
    }

    // chiamo l'endpoint per vedere i dettagli dell'evento
    // Costruire l'URL con il parametro di ricerca
    const urlEndP = new URL('http://localhost:5000/eventi');
    
    // Inserisci l'idevento nell'url dell'endpoint
    urlEndP.searchParams.append('idEvento', idEvento);

    fetch(urlEndP, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })

    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('container-dettaglio');
        container.innerHTML = '';
        data.forEach(evento => {
            // costruisco la card dell'evento ed inserisco il campo note ed il campo dei partecipanti
            const vDiv = document.createElement('div');
            vDiv.classList.add('card','text-center');
            vDiv.innerHTML = `
            <div class="card text-center" >
                <input type="hidden" id="idEvento" name="idEvento" value="${evento.id}">
                <input type="hidden" id="idPrenotazione" name="idPrenotazione" value="${idPrenotazione}">
                <input type="hidden" id="Prezzo" name="Prezzo" value="${evento.prezzo}">
                <img src="../img/${evento.imglink}" class="card-img-top">
                <div class="card-body">
                    <h5 class="card-title">${evento.titolo}</h5>
                    <p class="card-text"><small class="text-body-secondary">${evento.descrizione}</small></p>
                    <h5 class="card-title">${giornoSettimana(evento.dataEvento)} ${evento.dataEvento} Ore: ${evento.strOraEvento}</h5>
                    <p class="card-text"><small class="text-body-secondary">Prezzo Euro: ${evento.prezzo}</small></p>
                    <div class="form-group">
                        <label>Partecipanti:</label>
                        <select class="custom-select mr-sm-2" name="numeroPrenotati" id="numeroPrenotati">
                            <option selected>0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label >Note:</label>
                        <textarea class="form-control" rows="2" name="note" id="note" placeholder="Informazioni aggiuntive." maxlength="250">${note}</textarea>
                    </div>
                </div>
                <div class="card-body" id="messaggi">
                </div>
                <div class="card-body">
                    <a href="javascript:void(0);" onclick="registraPrenotazione()" class="card-link" id="lblSalva">Salva</a>
                    <a href="javascript:void(0);" onclick="cancellaPrenotazione()" class="card-link" id="lblCancella">Cancella</a>
                    <a href="javascript:void(0);" onclick="openPageBack()" class="card-link">Indietro</a>
                </div>
            </div>
            `;
            container.appendChild(vDiv);
            numpre = document.getElementById('numeroPrenotati').value = numeroPrenotati
            // metti il link cancella visibile o invisibile
            if (idPrenotazione) {
                document.getElementById("lblCancella").style.display = "inline";
            }else{
                document.getElementById("lblCancella").style.display = "none";
            }

        });
    })
    .catch(error => {
        console.error('Errore nel recupero evento. Errore :', error);
    });
}

function registraUtente() {

    // preleva il valore dei campi appena inseriti nella pagina di registrazione
    const nome = document.getElementById('nome').value.toLowerCase();
    const cognome = document.getElementById('cognome').value.toLowerCase();
    const email = document.getElementById('email').value.toLowerCase();
    const password = document.getElementById('password').value;

    const messaggiDiv = document.getElementById('messaggi');

    // verifica se i campi sono tutti pieni
    if (!password || !nome || !cognome || !email) {
        messaggiDiv.style.color = 'red';
        messaggiDiv.textContent = 'Attenzione. Riempire tutti i campi.';
        return;
    }
    // verifica se il campo email e' valido
    if (!validateEmail(email)){
        messaggiDiv.style.color = 'red';
        messaggiDiv.textContent = 'Attenzione. Indirizzo Email non valido.';
        return;
    }
    // verifica se la password è abbastanza complessa
    if (!passwordComplessa(password)) {
        messaggiDiv.style.color = 'red';
        messaggiDiv.textContent = 'La password deve contenere almeno 8 caratteri, una lettera maiuscola, una lettera minuscola, un numero e un carattere speciale.';
        return;
    }


    // preparo l'array di informazioni da inviare all'end point
    const userData = {nome,cognome,email,password};

    // chiamo l'endpoint api per registrare il nuovo utente, in caso di email duplicata password il database mi da errore poiche' ho impostato una chiave unica sul campo email
    fetch('http://localhost:5000/utente', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })

    .then(response => response.json())
    .then(data => {
        if (data.message) {
            // impostra il valori del session.SessionStorage per riutilizzarli nel momento della prenotazione o della cancelazione dell'evento
            sessionStorage.setItem('idUser', data.idUser)
            sessionStorage.setItem('nomeUtente', data.nomeUtente)
            // poi apre la schermata index.html
            window.location.href = `../index.html`;
        } else if (data.error) {
            messaggiDiv.style.color = 'red';
            messaggiDiv.textContent = data.error;
        }
    })
    .catch(error => {
        // l'endpoint restituisce un errore generico (esempio: errore di connessione, indirizzo email duplicato, etc, etc)
        console.error('Errore nella registrazione:', error);
    });

}

function registraPrenotazione() {
    const idEvento = document.getElementById('idEvento').value;
    const idPrenotazione = document.getElementById('idPrenotazione').value;
    const Prezzo = document.getElementById('Prezzo').value;

    const idUtente = sessionStorage.getItem('idUser');

    // preleva il valore dei campi appena inseriti nella pagina dell'evento
    const numeroPrenotati = parseInt(document.getElementById('numeroPrenotati').value); 
    const Note = document.getElementById('note').value;

    const messaggiDiv = document.getElementById('messaggi');

    // verifica l'utente connesso al sistema 
    if (!idUtente) {
        messaggiDiv.style.color = 'red';
        messaggiDiv.textContent = 'Attenzione, è necessario fare prima il login.';
        return;
    }

    // verifica se il campo prenotati e' alimentato
    if (numeroPrenotati == 0) {
        messaggiDiv.style.color = 'red';
        messaggiDiv.textContent = 'Inserire il numero dei partecipanti.';
        return;
    }

    // preparo l'array di informazioni da inviare all'end point
    const userData = {idEvento,idUtente,numeroPrenotati,Note,Prezzo};

    // separo la chiamata all endpoint in base all'inserimento o modifica della prenotazione
    if (idPrenotazione == 0) {
        // inserisci una nuova prenotazione

        // chiamo l'endpoint api per registrare la nuova prenotazione
        fetch('http://localhost:5000/prenotazione', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })

        .then(response => response.json())
        .then(data => {
            if (data.message) {

                // apri la messagebox con esito positivo e restituisce il messaggio
                apriMessageBox(data.message + ". Il prezzo è di Euro " + data.prezzo + " da saldare il loco il giorno dell\'evento.");

            } else if (data.error) {

                // apri la messagebox con esito negativo e restituisce il messaggio
                apriMessageBox(data.error);
            }
        })
        .catch(error => {
            // l'endpoint restituisce un errore generico
            console.error('Errore Inserimento Prenotazione:', error);
        });


    }else{
        // fai la modifica ad una prenotazione già esistente

        // chiamo l'endpoint api per registrare la nuova prenotazione
        fetch(`http://localhost:5000/prenotazione/${idPrenotazione}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })

        .then(response => response.json())
        .then(data => {
            if (data.message) {

                // apri la messagebox con esito positivo e restituisce il messaggio
                apriMessageBox(data.message + ". Il prezzo è di Euro " + data.prezzo + " da saldare il loco il giorno dell\'evento.");

            } else if (data.error) {

                // apri la messagebox con esito negativo e restituisce il messaggio
                apriMessageBox(data.error);
            }
        })
        .catch(error => {
            // l'endpoint restituisce un errore generico
            console.error('Errore Modifica Prenotazione:', error);
        });


    }

}

function cancellaPrenotazione() {
    // prendi l id della prenotazione per procedere alla cancellazione
    const idUtente = sessionStorage.getItem('idUser');
    const idPrenotazione = document.getElementById('idPrenotazione').value;

    const messaggiDiv = document.getElementById('messaggi');

    // verifica l'utente connesso al sistema 
    if (!idUtente) {
        messaggiDiv.style.color = 'red';
        messaggiDiv.textContent = 'Attenzione, è necessario fare prima il login.';
        return;
    }

    fetch(`http://localhost:5000/prenotazione/${idPrenotazione}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {

            // apri la messagebox con esito positivo e restituisce il messaggio
            apriMessageBox(data.message);

        } else if (data.error) {

            // apri la messagebox con esito negativo e restituisce il messaggio
            apriMessageBox(data.error);
        }
    })
    .catch(error => {
        // l'endpoint restituisce un errore generico
        console.error('Errore nella cancellazione:', error);
    });
}

function openPageDettaglio(valId) {
    // Salvo L'Id evento nel SessionStorage
    sessionStorage.setItem('idVis', valId)
    // apro la pagina del dettaglio dell'evento
    window.location.href = `evento/dettaglio.html`;
}

function openPageBack(){
    // ho previsto questa funzione per aggiungere nuove future funzionalita' e per tornare alla pagina precedente.
    // torna alla pagina precedente
    window.history.back()
}

function validateEmail(email) {
    // definisco un pattern per il controllo della mail
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // applico il pattner e testo il campo in input
    return emailPattern.test(email);
}

function ricercaEventi() {
    // faccio il retrieve del valore da ricercare
    const testoRicerca = document.getElementById('txtRicerca').value;
    // chiamo la funzione che mi restituisce gli eventi
    elencoEventi(testoRicerca);
}

function giornoSettimana(strData) {
    // converte la stringa data in un formato specifico
    let parts = strData.split('/');
    if (parts.length === 3) {
        strData = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    let date = new Date(strData) 
    //definisce un array specifico con i giorni della settimana
    let aryGiorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    // restituisce l'elemento dell array corretto in base alla funzione getUTCDay
    let giorno = aryGiorni[date.getUTCDay()];
    return giorno 
}

function primaMaiuscola(strParola) {
    // questa funzione ci aiuta a modificare una stringa mettendo la prima lettera in maiuscolo
    return strParola.charAt(0).toUpperCase() + strParola.slice(1);
}

// Funzione per gestire il modale
function apriMessageBox(message) {
    // imposta il messaggio nella messagebox
    $('#messageBox .modal-body').text(message);
    // visualizza la messagebox
    $('#messageBox').modal('show');
}
  
function chiudiMessageBox() {
    // nasconde la message box
    $('#messageBox').modal('hide');
    // torna alla pagina precedente
    window.history.back()
}

function passwordComplessa(password) {
    // stringa di confronto per password complessa
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}
