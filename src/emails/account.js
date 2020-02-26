const sgMail = require('@sendgrid/mail');
const sgMailSecret = process.env.SENDGRID_API_KEY
sgMail.setApiKey(sgMailSecret);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'matan.banner+madunda@gmail.com',
    subject: 'Thanks for joining in!',
    text: `Welcome to the app, ${name}. Let me know how you get alone with the app.`
  })
}

const sendGoodByeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'matan.banner+madunda@gmail.com',
    subject: 'Goodbye!',
    text: `${name}, we thank you for using our app. Hope to see you again soon :)`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendGoodByeEmail
}
