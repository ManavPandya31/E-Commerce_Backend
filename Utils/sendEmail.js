//nsole.log("sendEmail function started");
import nodeMailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {

  try {
    const transporter = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        
      },
    });
    
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS exists:", process.env.EMAIL_PASS ? true : false);

     await transporter.verify();
    //console.log("SMTP Ready");

    await transporter.sendMail({
      from: `"My App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email Sent Successfully");


  } catch (error) {
    console.error("Email Error:", error);
    throw error;
  }
};

export default sendEmail;