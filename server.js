require('dotenv').config();

const nodemailer = require('nodemailer');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Message = require('./models/message');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('./models/admin');

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
    service: 'gmail',
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

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/public/index.html');
// });

app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});