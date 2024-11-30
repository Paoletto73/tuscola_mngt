from flask import Flask, request, jsonify
import mysql.connector
import bcrypt

from mysql.connector import Error
from flask_cors import CORS
from datetime import datetime


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost", "http://127.0.0.1","https://localhost", "https://127.0.0.1"], 
                             "methods": ["GET", "POST", "OPTIONS", "DELETE", "PUT"]}})

def connessioneDB():
    # funzione utilizzata per stabilire una connessione al database mysql sulla porta 3306
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='tuscola_mngt',
            user='tuscola_mngt',
            password='Pelli4Kan!!'
        )
        return connection
    except Error as e:
        print(f"Connessione al Database non riuscita. Codice Errore: {e}")
        return None

def verificaPosti(cursor, idEvento, numeroPrenotati):

    # Verifica il numero di posti già prenotati per l'evento
    cursor.execute("SELECT SUM(numeroPrenotati) FROM prenotazioni WHERE idEvento = %s", (idEvento,))
    postiPrenotati = cursor.fetchone()[0] or 0  

    # Recupera il numero massimo di posti disponibili per l'evento
    cursor.execute("SELECT numeroPosti FROM eventi WHERE id = %s", (idEvento,))
    postiDisponibili = cursor.fetchone()

    # Se l'evento non viene trovato, restituisci False
    if postiDisponibili is None:
        return False
    
    postiDisponibili = postiDisponibili[0]

    # Se non ci sono abbastanza posti disponibili, restituisci False
    if postiPrenotati + numeroPrenotati > postiDisponibili:
        return False

    # Se i posti sono disponibili, restituisci True
    return True

@app.route('/eventi', methods=['GET'])
def elencoEventi():
    # Definizione di params come lista vuota
    params = []

    testoRicerca = request.args.get('Titolo', '')
    idEvento = request.args.get('idEvento', '')

    # apre la connessione al db mysql attravero la funzione connessioneDB
    connection = connessioneDB()
    if connection is None:
        return jsonify({'error': 'Connessione al Database non riuscita'}), 500
    cursor = connection.cursor(dictionary=True)
    strsql = "SELECT id,titolo,descrizione,prezzo,dataEvento,convert(oraEvento,CHAR) as strOraEvento, convert(numeroPosti,CHAR) as strNumeroPosti,imglink FROM eventi where dataEvento >= CURRENT_DATE()"

    # nel caso stiamo ricercando un evento specifico inseriamo un ulteriore where sul titolo dell evento
    if testoRicerca != "":
        strsql += "and titolo like %s"
        params.append(f"%{testoRicerca}%")

    # nel caso stiamo ricercando un evento specifico per id 
    if idEvento !="":
        strsql += "and id=%s"
        params.append(f"{idEvento}")

    cursor.execute(strsql,params)
    eventi = cursor.fetchall()

    # converti la data in stringa per il json
    for evento in eventi:
        if evento['dataEvento']:
             evento['dataEvento'] = evento['dataEvento'].strftime('%d/%m/%Y')

    cursor.close()
    connection.close()
    return jsonify(eventi)

@app.route('/utente', methods=['POST'])
def registraUtente():
    data = request.get_json()
    nome = data.get('nome')
    cognome = data.get('cognome')
    email = data.get('email')
    password = data.get('password')

    try:
        # apre la connessione al db mysql attravero la funzione connessioneDB
        connection = connessioneDB()
        if connection is None:
            return jsonify({'error': 'Errore di connessione al database'}), 500
        cursor = connection.cursor()

        # cripta la password con bcrypt
        salt = bcrypt.gensalt()
        hash = bcrypt.hashpw(password.encode('utf-8'), salt)

        # Inserisci l utente nella tabella utenti
        cursor.execute("INSERT INTO utenti (nome,cognome,email,password) VALUES (%s, %s, %s, %s)", (nome, cognome, email, hash))
       
        connection.commit()
       
        idUserNuovo = cursor.lastrowid

        cursor.close()
        connection.close()
        return jsonify({'message': 'Registrazione utente effettuata con successo', 'idUser': idUserNuovo, 'nomeUtente': nome}), 201

    except Error as e:
        print(f"Errore SQL: {e}")
        return jsonify({'error': 'Errore durante la registrazione utente'}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data['email'].strip()
    password = data['password']

    try:
        # apre la connessione al db mysql attravero la funzione connessioneDB
        connection = connessioneDB()
        if connection is None:
            return jsonify({'error': 'Errore di connessione al database'}), 500
        cursor = connection.cursor()

        cursor.execute("SELECT id,nome,password FROM utenti WHERE email = %s", (email,))
        result = cursor.fetchone()

        if result is None:
            return jsonify({"error": "Email o password errati."}), 401

        storedHash = result[2]
        
        # fai un confronto della password con Bcrypt
        if bcrypt.checkpw(password.encode('utf-8'), storedHash.encode('utf-8')):
            idUser = result[0]
            nome = result[1]
            return jsonify({"message": "Verifica andata a buon fine.",'idUser': idUser, 'nomeUtente': nome}), 201
        else:
            return jsonify({"error": "Email o password errati."}), 401
        cursor.close()
        conn.close()

    except Error as e:
        print(f"Errore SQL: {e}")
        return jsonify({'error': 'Errore durante la verifica utente'}), 500

@app.route('/prenotazione', methods=['POST'])
def inserisciPrenotazione():
    data = request.get_json()

    idEvento = data.get('idEvento')
    idUtente = data.get('idUtente')
    numeroPrenotati = data.get('numeroPrenotati')
    note = data.get('Note')
    prezzo = data.get('Prezzo')

    try:
        # apre la connessione al db mysql attravero la funzione connessioneDB
        connection = connessioneDB()
        if connection is None:
            return jsonify({'error': 'Errore di connessione al database'}), 500
        cursor = connection.cursor()

        # verifichiamo se il numero dei posti è disponibile
        if verificaPosti(cursor,idEvento,numeroPrenotati):
            # Inserisci la prenotazione nella tabella delle prenotazioni
            cursor.execute("INSERT INTO prenotazioni (idEvento,idUtente,numeroPrenotati,noteEvento) VALUES (%s, %s, %s, %s)", (idEvento, idUtente, numeroPrenotati, note))
            connection.commit()
        else:
            return jsonify({'error': 'Numero di posti non disponibile per l\'evento'}), 400
       
        cursor.close()
        connection.close()
        return jsonify({'message': 'Prenotazione registrata con successo','prezzo':float(prezzo)*numeroPrenotati}), 201

    except Error as e:
        print(f"Errore SQL: {e}")
        return jsonify({'error': 'Errore durante la registrazione della prenotazione'}), 500


@app.route('/prenotazione/<int:idPrenotazione>', methods=['PUT'])
def modificaPrenotazione(idPrenotazione):
    data = request.get_json()

    idEvento = data.get('idEvento')
    idUtente = data.get('idUtente')
    numeroPrenotati = data.get('numeroPrenotati')
    note = data.get('note')
    prezzo = data.get('Prezzo')

    try:
        # apre la connessione al db mysql attravero la funzione connessioneDB
        connection = connessioneDB()
        if connection is None:
            return jsonify({'error': 'Errore di connessione al database'}), 500
        cursor = connection.cursor()

        # verifichiamo se il numero dei posti è disponibile
        if verificaPosti(cursor,idEvento,numeroPrenotati):
            # fai l'update della prenotazione nella tabella delle prenotazioni
            cursor.execute("UPDATE prenotazioni set numeroPrenotati = %s, noteEvento = %s where id = %s", (numeroPrenotati, note, idPrenotazione))
            connection.commit()
        else:
            return jsonify({'error': 'Numero di posti non disponibile per l\'evento'}), 400
       
        cursor.close()
        connection.close()
        return jsonify({'message': 'Prenotazione registrata con successo','prezzo':float(prezzo)*numeroPrenotati}), 201

    except Error as e:
        print(f"Errore SQL: {e}")
        return jsonify({'error': 'Errore durante la registrazione della prenotazione'}), 500

@app.route('/prenotazione/<int:idPrenotazione>', methods=['DELETE'])
def cancellaPrenotazione(idPrenotazione):
    try:
        # apre la connessione al db mysql attravero la funzione connessioneDB
        connection = connessioneDB()
        if connection is None:
            return jsonify({'error': 'Errore di connessione al database'}), 500
        cursor = connection.cursor()

        #prepara la query di cancellazione nel db con il numero di prenotazione che ci hanno inviato sull endpoint
        cursor.execute("DELETE FROM prenotazioni WHERE id = %s", (idPrenotazione,))
        connection.commit()
        cursor.close()
        connection.close()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Record non trovato'}), 404

        return jsonify({'success': True, 'message': 'Prenotazione cancellatta con successo'}),201
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500

@app.route('/prenotazione', methods=['GET'])
def verificaPrenotazione():

    # leggi i parametri dalla chiamata
    idUtente = request.args.get('idUtente', '')
    idEvento = request.args.get('idEvento', '')

    try:

        connection = connessioneDB()
        if connection is None:
            return jsonify({'error': 'Errore di connessione al database'}), 500
        cursor = connection.cursor()

        # verifico se esiste gia' una prenotazione per quell user e per quell evento
        cursor.execute("SELECT * from prenotazioni where idUtente = %s and idEvento = %s", (idUtente,idEvento))
        result = cursor.fetchone()

        if result:
            idPrenotazione = result[0]
            numeroPrenotati = result[3]
            noteEvento = result[4]
            return jsonify({'idPrenotazione': idPrenotazione, 'numeroPrenotati': numeroPrenotati, 'noteEvento': noteEvento}), 201
        else:
            return jsonify({"norec": "Nessun Record."}), 201
        cursor.close()
        conn.close()

    except Error as e:
        print(f"Errore SQL: {e}")
        return jsonify({'error': 'Errore durante la verifica della prenotazione'}), 500

if __name__ == '__main__':
    app.run(debug=True)

