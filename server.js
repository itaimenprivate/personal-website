const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const { isValidEmail } = require('./validation');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve static files for styles and images
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: true
    }
});

// Verify the connection configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('SMTP connection error:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });
    } else {
        console.log('Server is ready to send emails');
    }
});

// API endpoint for sending emails
app.post('/send-email', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and message are required fields' 
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }
        
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: `Contact Form Message from ${name}`,
                text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
                html: `<p><strong>Name:</strong> ${name}</p>
                      <p><strong>Email:</strong> ${email}</p>
                      <p><strong>Message:</strong> ${message}</p>`
            });
            
            res.json({ success: true, message: 'Email sent successfully!' });
        } catch (error) {
            console.error('Error sending email:', error.message);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send email',
                error: error.message
            });
        }
    } catch (error) {
        console.error('Request error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message
        });
    }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Only start the server if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for testing
module.exports = app;
