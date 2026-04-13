const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    nom:        { type: String, required: true },
    prenom:     { type: String, required: true },
    email:      { type: String, required: true },
    phone:      { type: String },
    nbPersonnes: { type: Number, required: true },
    startDate:  { type: Date, required: true },
    endDate:    { type: Date, required: true },
    nbNuits:    { type: Number, required: true },
    prixTotal:  { type: Number, required: true },
    statut:     { type: String, default: 'en attente' }, // 'en attente', 'confirmée', 'annulée'
    date:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reservation', reservationSchema);