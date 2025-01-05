const request = require('supertest');
const nodemailer = require('nodemailer');

// Mock nodemailer before requiring server
jest.mock('nodemailer');

// Create mock transporter
const mockTransporter = {
    verify: jest.fn().mockImplementation((callback) => callback(null, true)),
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
};

// Setup nodemailer mock
nodemailer.createTransport.mockReturnValue(mockTransporter);

// Require server after mocking
const app = require('../server');

describe('Email API Endpoints', () => {
    beforeEach(() => {
        // Clear mock data before each test
        jest.clearAllMocks();
    });

    describe('POST /send-email', () => {
        const validPayload = {
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test Subject',
            message: 'Test Message'
        };

        it('should send email successfully with valid payload', async () => {
            const response = await request(app)
                .post('/send-email')
                .send(validPayload);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
        });

        it('should return 400 when required fields are missing', async () => {
            const invalidPayload = {
                name: 'Test User',
                // missing email and message
                subject: 'Test Subject'
            };

            const response = await request(app)
                .post('/send-email')
                .send(invalidPayload);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Name, email, and message are required fields');
            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid email format', async () => {
            const invalidEmailPayload = {
                name: 'Test User',
                email: 'invalid-email',
                subject: 'Test Subject',
                message: 'Test Message'
            };

            const response = await request(app)
                .post('/send-email')
                .send(invalidEmailPayload);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email format');
            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });

        it('should handle email service errors', async () => {
            mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

            const response = await request(app)
                .post('/send-email')
                .send(validPayload);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error sending email');
            expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
        });
    });
});
