document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin-login.html';
        return;
    }

    // Chargement des messages
    fetch('/api/admin/messages', {
        headers: { 'authorization': token }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            afficherMessages(data.messages)
        } else {
            window.location.href = '/admin-login.html';
        }
    });

    // Chargement des réservations
    fetch('/api/admin/reservations', {
        headers: { 'authorization': token }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) afficherReservations(data.reservations);
    });

    // Onglet actif par défaut
    afficherOnglet('messages');
});


// GESTION DES ONGLETS
function afficherOnglet(onglet) {
    document.getElementById('messagesList').style.display     = onglet === 'messages'      ? 'block' : 'none';
    document.getElementById('reservationsList').style.display = onglet === 'reservations'  ? 'block' : 'none';
}


// MESSAGES
function afficherMessages(messages) {
    const messagesList = document.getElementById('messagesList');

    if (messages.length === 0) {
        messagesList.innerHTML = '<p>Aucun message reçu.</p>';
        return;
    }

    messagesList.innerHTML = messages.map(msg => `
        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
            <p><strong>De :</strong> ${msg.prenom} ${msg.nom}</p>
            <p><strong>Email :</strong> ${msg.email}</p>
            <p><strong>Téléphone :</strong> ${msg.phone || 'Non renseigné'}</p>
            <p><strong>Date :</strong> ${new Date(msg.date).toLocaleDateString('fr-FR')}</p>
            <p><strong>Message :</strong> ${msg.message}</p>
            <button onclick="afficherReponse('${msg._id}')">Répondre</button>
            <div id="reponse-${msg._id}" style="display:none;">
                <textarea id="texte-${msg._id}" rows="5" placeholder="Votre réponse..."></textarea>
                <button onclick="envoyerReponse('${msg._id}', '${msg.email}', '${msg.prenom}')">Envoyer la réponse</button>
            </div>
        </div>
    `).join('');
}

function afficherReponse(id) {
    const div = document.getElementById('reponse-' + id);
    div.style.display = div.style.display === 'none' ? 'block' : 'none';
}

function envoyerReponse(id, email, prenom) {
    const texte = document.getElementById('texte-' + id).value;
    const token = localStorage.getItem('adminToken');

    if (!texte) {
        alert('Veuillez écrire une réponse.');
        return;
    }

    fetch('/api/admin/repondre', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': token
        },
        body: JSON.stringify({ email, prenom, texte })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert('Réponse envoyée.');
            document.getElementById('reponse-' + id).style.display = 'none';
        } else {
            alert('Erreur lors de l\'envoi.');
        }
    });
}


// RESERVATIONS
function afficherReservations(reservations) {
    const reservationsList = document.getElementById('reservationsList');

    if (reservations.length === 0) {
        reservationsList.innerHTML = '<p>Aucune réservation reçue.</p>';
        return;
    }

    reservationsList.innerHTML = reservations.map(resa => `
        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
            <p><strong>De :</strong> ${resa.prenom} ${resa.nom}</p>
            <p><strong>Email :</strong> ${resa.email}</p>
            <p><strong>Téléphone :</strong> ${resa.phone || 'Non renseigné'}</p>
            <p><strong>Arrivée :</strong> ${new Date(resa.startDate).toLocaleDateString('fr-FR')}</p>
            <p><strong>Départ :</strong> ${new Date(resa.endDate).toLocaleDateString('fr-FR')}</p>
            <p><strong>Nuits :</strong> ${resa.nbNuits}</p>
            <p><strong>Personnes :</strong> ${resa.nbPersonnes}</p>
            <p><strong>Prix total :</strong> ${resa.prixTotal} €</p>
            <p><strong>Statut :</strong> <span id="statut-${resa._id}">${resa.statut}</span></p>
            <p><strong>Reçue le :</strong> ${new Date(resa.date).toLocaleDateString('fr-FR')}</p>
            <button onclick="changerStatut('${resa._id}', 'confirmée')">Confirmer</button>
            <button onclick="changerStatut('${resa._id}', 'annulée')">Annuler</button>
        </div>
    `).join('');
}

function changerStatut(id, statut) {
    const token = localStorage.getItem('adminToken');

    fetch('/api/admin/reservations/' + id, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'authorization': token
        },
        body: JSON.stringify({ statut })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            document.getElementById('statut-' + id).textContent = statut;
        } else {
            alert('Erreur lors de la mise à jour du statut.');
        }
    });
}


// DECONNEXION
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
});