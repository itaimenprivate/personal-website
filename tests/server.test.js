const request = require('supertest');
const nodemailer = require('nodemailer');
const app = require('../server');
const { isValidEmail } = require('../validation');

// Mock nodemailer
jest.mock('nodemailer');

describe('Email API Endpoints', () => {
    let mockSendMail;

    beforeEach(() => {
        // Setup mock for each test
        mockSendMail = jest.fn().mockResolvedValue({ response: 'Email sent' });
        nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });
    });

    afterEach(() => {
        jest.clearAllMocks();
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
                expect(mockSendMail).toHaveBeenCalled();
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
        });

        it('should handle server errors gracefully', async () => {
            // Force an error by sending invalid data type
            const response = await request(app)
                .post('/send-email')
                .send(null);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBeTruthy();
        });
    });
});
