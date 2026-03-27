const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    nom: String,
    prenom: String,
    email: String,
    phone: String,
    message: String,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);