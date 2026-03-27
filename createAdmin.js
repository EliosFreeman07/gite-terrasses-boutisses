require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const hash = await bcrypt.hash('motdepasse123', 10);
        await Admin.create({ username: 'admin', password: hash });
        console.log('Administrateur créé');
        mongoose.connection.close();
    })
    .catch(err => console.error(err));