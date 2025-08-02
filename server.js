require('dotenv').config(); // Încarcă variabilele de mediu din .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const User = require('./models/User'); // Importă modelul User
const { sendSMS } = require('./utils/smsService'); // Importă serviciul SMS

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware-uri
app.use(express.json()); // Permite serverului să parseze JSON din corpul cererilor

// === CONFIGURARE CORS CORECTĂ ===
const corsOptions = {
    origin: 'https://aplicatie-evidenta-frontend.onrender.com',
    optionsSuccessStatus: 200 // Pentru browserele mai vechi
};
app.use(cors(corsOptions));

// Conectare la MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectat la MongoDB!'))
  .catch(err => console.error('Eroare la conectarea la MongoDB:', err));

// Importă rutele
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const simulationRoutes = require('./routes/simulations');
// Poți adăuga rute separate pentru prezență și abonamente, dacă logica devine mai complexă

// Folosește rutele
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/simulations', simulationRoutes);

// Rută de test
app.get('/', (req, res) => {
  res.send('API AplicatieEvidenta Rulează!');
});

// Programare pentru a verifica abonamentele zilnic la miezul nopții (00:00)
cron.schedule('0 0 * * *', async () => {
  console.log('Verificarea abonamentelor...');
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  try {
    const usersToNotify = await User.find({
      subscriptionEndDate: { $gte: new Date(), $lte: threeDaysFromNow }
    });

    for (const user of usersToNotify) {
      const formattedDate = user.subscriptionEndDate.toLocaleDateString('ro-RO');
      const message = `Salut, ${user.name}! Abonamentul tau la AplicatieEvidenta expira pe ${formattedDate}. Te rugam sa il reanoiesti.`;
      // Asigură-te că numărul de telefon are prefixul țării (ex: +407...)
      if (user.phoneNumber.startsWith('+')) { // Verifică dacă numărul include deja prefixul țării
        await sendSMS(user.phoneNumber, message);
      } else {
        // Dacă nu, adaugă un prefix default pentru România. Ajustează dacă e nevoie de alte țări.
        await sendSMS(`+40${user.phoneNumber}`, message);
      }
    }
    console.log(`Notificări trimise pentru ${usersToNotify.length} abonamente.`);
  } catch (error) {
    console.error('Eroare la verificarea abonamentelor:', error);
  }
});


// Pornirea serverului
app.listen(PORT, () => {
  console.log(`Serverul rulează pe portul ${PORT}`);
});

//test git