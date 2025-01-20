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
        let mockSendMail;

        beforeEach(() => {
            mockSendMail = jest.fn().mockResolvedValue({ response: 'Email sent' });
            nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });
        });

        // Valid email test cases
        const validEmails = [
            'user@domain.com',
            'user.name@domain.com',
            'user-name@domain.com',
            'user_name@domain.com',
            'user123@domain.com',
            'user@sub.domain.com',
            'user@domain.co.uk'
        ];

        validEmails.forEach(email => {
            it(`should accept valid email format: ${email}`, async () => {
                const response = await request(app)
                    .post('/send-email')
                    .send({
                        name: 'Test User',
                        email: email,
                        message: 'Test message'
                    });
                
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        // Invalid email test cases
        const invalidEmails = [
            { email: '.user@domain.com', desc: 'starts with dot' },
            { email: 'user.@domain.com', desc: 'ends with dot' },
            { email: 'user@.domain.com', desc: 'dot after @' },
            { email: 'user@domain..com', desc: 'consecutive dots' },
            { email: 'user@domain.c', desc: 'single-letter TLD' },
            { email: 'user@domain.123', desc: 'numeric TLD' },
            { email: 'user@-domain.com', desc: 'domain starts with hyphen' },
            { email: 'user@domain-.com', desc: 'domain ends with hyphen' },
            { email: '@domain.com', desc: 'missing username' },
            { email: 'user@.com', desc: 'missing domain' },
            { email: 'user.domain.com', desc: 'missing @' },
            { email: 'user@@domain.com', desc: 'multiple @' },
            { email: 'user@domain', desc: 'missing TLD' }
        ];

        invalidEmails.forEach(({ email, desc }) => {
            it(`should reject invalid email format (${desc}): ${email}`, async () => {
                const response = await request(app)
                    .post('/send-email')
                    .send({
                        name: 'Test User',
                        email: email,
                        message: 'Test message'
                    });
                
                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Invalid email format');
            });
        });

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
