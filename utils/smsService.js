const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = new twilio(accountSid, authToken);

exports.sendSMS = async (to, body) => {
  // Asigură-te că ai configurat variabilele de mediu Twilio
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.warn('Variabilele de mediu Twilio nu sunt configurate. SMS-ul nu va fi trimis.');
    return;
  }
  try {
    await client.messages.create({
      body: body,
      to: to, // Numărul de telefon al destinatarului (ex: '+407xxxxxxxx')
      from: twilioPhoneNumber // Numărul tău Twilio
    });
    console.log(`SMS trimis către ${to}`);
  } catch (error) {
    console.error(`Eroare la trimiterea SMS către ${to}:`, error.message);
    // Poți adăuga o notificare sau logare a erorii aici
  }
};