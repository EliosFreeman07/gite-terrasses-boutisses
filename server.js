require('dotenv').config();

const nodemailer = require('nodemailer');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Message = require('./models/message');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('./models/admin');
const Reservation = require('./models/reservation');

const verifierToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token manquant.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token invalide.' });
    }
};


mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connecté à MongoDB'))
    .catch(err => console.error('Erreur connexion MongoDB :', err));


app.use(express.static('public'));
app.use(express.json());

app.get('/api/admin/messages', verifierToken, async (req, res) => {
    try {
        const messages = await Message.find().sort({ date: -1 });
        res.json({ success: true, messages });
    } catch (err) {
        console.error('Erreur récupération messages :', err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/contact', async (req, res) => {
    const { nom, prenom, email, phone, message } = req.body;

    if (!nom || !prenom || !email || !message) {
        return res.status(400).json({ success: false, message: 'Champs requis manquants.' });
    }

    const mailOptions = {
        from: `"${prenom} ${nom}" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        replyTo: email,
        subject: `Nouveau message de ${prenom} ${nom}`,
        text: `
Nom : ${nom} ${prenom}
Email : ${email}
Téléphone : ${phone || 'Non renseigné'}

Message :
${message}
        `
    };

    try {
        const nouveauMessage = new Message({ nom, prenom, email, phone, message });
        await nouveauMessage.save();
        console.log('Message sauvegardé :', nouveauMessage);
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Votre message a bien été envoyé.' });
    } catch (err) {
        console.error('Erreur :', err);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi. Réessayez plus tard.' });
    }
});

app.post('/api/admin/login', async (req, res) => {
    console.log('Route /admin/login atteinte');
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
        }

        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ success: true, token });

    } catch (err) {
        console.error('Erreur login :', err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

app.post('/api/admin/repondre', verifierToken, async (req, res) => {
    const { email, prenom, texte } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Réponse à votre message - Gîte Terrasses des Boutisses`,
        text: `Bonjour ${prenom},\n\n${texte}\n\nCordialement,\nSabine\nGîte Terrasses des Boutisses`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (err) {
        console.error('Erreur envoi réponse :', err);
        res.status(500).json({ success: false });
    }
});


// Réception d'une réservation depuis le formulaire
app.post('/api/reservations', async (req, res) => {
    const { nom, prenom, email, phone, startDate, endDate, nbNuits, nbPersonnes, prixTotal } = req.body;

    if (!nom || !prenom || !email || !startDate || !endDate || !nbPersonnes) {
        return res.status(400).json({ success: false, message: 'Champs requis manquants.' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject: `Nouvelle demande de réservation - ${prenom} ${nom}`,
        text: `
Nouvelle demande de réservation :

Nom : ${prenom} ${nom}
Email : ${email}
Téléphone : ${phone || 'Non renseigné'}
Arrivée : ${startDate}
Départ : ${endDate}
Nombre de nuits : ${nbNuits}
Nombre de personnes : ${nbPersonnes}
Prix total : ${prixTotal} €
        `
    };

    try {
        const nouvelleResa = new Reservation({ nom, prenom, email, phone, startDate, endDate, nbNuits, nbPersonnes, prixTotal });
        await nouvelleResa.save();
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Votre demande de réservation a bien été envoyée.' });
    } catch (err) {
        console.error('Erreur réservation :', err);
        res.status(500).json({ success: false, message: 'Erreur serveur. Réessayez plus tard.' });
    }
});

// Consultation des réservations (admin uniquement)
app.get('/api/admin/reservations', verifierToken, async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ date: -1 });
        res.json({ success: true, reservations });
    } catch (err) {
        console.error('Erreur récupération réservations :', err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// Modifier le statut d'une réservation depuis l'admin :
app.patch('/api/admin/reservations/:id', verifierToken, async (req, res) => {
    const { statut } = req.body;
    const statutsValides = ['en attente', 'confirmée', 'annulée'];

    if (!statutsValides.includes(statut)) {
        return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    try {
        const resa = await Reservation.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true } // retourne le document mis à jour
        );

        const sujet = statut === 'confirmée'
            ? 'Confirmation de votre réservation - Gîte Terrasses des Boutisses'
            : 'Annulation de votre réservation - Gîte Terrasses des Boutisses';

        const texte = statut === 'confirmée'
            ? `Bonjour ${resa.prenom},\n\nNous avons le plaisir de vous confirmer votre réservation aux dates suivantes :\n\nArrivée : ${new Date(resa.startDate).toLocaleDateString('fr-FR')}\nDépart : ${new Date(resa.endDate).toLocaleDateString('fr-FR')}\nNombre de nuits : ${resa.nbNuits}\nNombre de personnes : ${resa.nbPersonnes}\nPrix total : ${resa.prixTotal} €\n\nUn acompte de 30% (${Math.round(resa.prixTotal * 0.3)} €) sera nécessaire pour finaliser la réservation.\n\nCordialement,\nSabine\nGîte Terrasses des Boutisses`
            : `Bonjour ${resa.prenom},\n\nNous vous informons que votre réservation aux dates suivantes a été annulée :\n\nArrivée : ${new Date(resa.startDate).toLocaleDateString('fr-FR')}\nDépart : ${new Date(resa.endDate).toLocaleDateString('fr-FR')}\n\nN'hésitez pas à nous contacter pour toute question.\n\nCordialement,\nSabine\nGîte Terrasses des Boutisses`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: resa.email,
            subject: sujet,
            text: texte
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Erreur mise à jour statut :', err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/public/index.html');
// });

app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});