import nodeMailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {

  try {
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        
      },
    });

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