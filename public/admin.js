document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin-login.html';
        return;
    }

    fetch('/api/admin/messages', {
        method: 'GET',
        headers: { 'authorization': token }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            afficherMessages(data.messages);
        } else {
            window.location.href = '/admin-login.html';
        }
    });
});

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
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Réponse envoyée.');
            document.getElementById('reponse-' + id).style.display = 'none';
        } else {
            alert('Erreur lors de l\'envoi.');
        }
    });
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
});
