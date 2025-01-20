const request = require('supertest');
const nodemailer = require('nodemailer');

// Mock nodemailer before requiring the app
jest.mock('nodemailer');

// Setup nodemailer mock
const mockSendMail = jest.fn().mockResolvedValue({ response: 'Email sent' });
const mockTransporter = {
    sendMail: mockSendMail,
    verify: jest.fn().mockImplementation(cb => cb(null, true))
};
nodemailer.createTransport.mockReturnValue(mockTransporter);

// Set test environment
process.env.NODE_ENV = 'test';

// Now require the app
const app = require('../server');
const { isValidEmail } = require('../validation');

describe('Email API Endpoints', () => {
    beforeEach(() => {
        // Clear mock data before each test
        jest.clearAllMocks();
        mockSendMail.mockClear();
    });

    describe('POST /send-email', () => {
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
                expect(mockSendMail).toHaveBeenCalledTimes(1);
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
                expect(mockSendMail).not.toHaveBeenCalled();
            });
        });

        it('should reject requests with missing required fields', async () => {
            const response = await request(app)
                .post('/send-email')
                .send({
                    name: 'Test User',
                    // missing email
                    message: 'Test message'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('required fields');
            expect(mockSendMail).not.toHaveBeenCalled();
        });

        it('should handle email service errors', async () => {
            mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

            const response = await request(app)
                .post('/send-email')
                .send({
                    name: 'Test User',
                    email: 'valid@email.com',
                    message: 'Test message'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to send email');
            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });
    });
});
