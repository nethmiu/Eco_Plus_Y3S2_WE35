const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1. Create a transporter (the service that will send the email, e.g., Gmail)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME || "assigmentgroupy@gmail.com",
            pass: process.env.EMAIL_PASSWORD || "iehlzcwppdmyanld",
        },
    });

    // 2. Define the email options
    const mailOptions = {
        from: '"Eco Pulse" <assigmentgroupy@gmail.com>',
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    // 3. Actually send the email
    await transporter.sendMail(mailOptions);
};

// Welcome email සඳහා වෙන්වූ function එකක්
exports.sendWelcomeEmail = async (userEmail, userName) => {
    const subject = 'Welcome to the Eco Pulse Family! 🌿';
    
    // HTML email template එක
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2E7D32;">Welcome, ${userName}!</h2>
            <p>Thank you for joining Eco Pulse, your personal guide to a more sustainable lifestyle.</p>
            <p>We are thrilled to have you on board. Here's what you can do to get started:</p>
            <ul>
                <li>Track your carbon footprint.</li>
                <li>Participate in fun and impactful challenges.</li>
                <li>Connect with a community that cares about our planet.</li>
            </ul>
            <p>Let's make a positive impact together!</p>
            <br>
            <p>Best regards,</p>
            <p><strong>The Eco Pulse Team</strong></p>
        </div>
    `;

    await sendEmail({
        email: userEmail,
        subject,
        html
    });
};