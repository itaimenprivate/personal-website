/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { isValidEmail } = require('../validation');

describe('Contact Form Functionality', () => {
    let dom;
    let document;
    let window;
    let form;
    let submitButton;
    let fetchMock;

    beforeEach(() => {
        // Set up our document body
        const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
        dom = new JSDOM(html, { runScripts: 'dangerously' });
        document = dom.window.document;
        window = dom.window;

        // Get form elements
        form = document.getElementById('contact-form');
        submitButton = document.getElementById('submit-btn');

        // Mock fetch
        fetchMock = jest.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true })
            })
        );
        global.fetch = fetchMock;

        // Mock form submission function
        global.sendEmail = jest.fn(async (event) => {
            event.preventDefault();
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            try {
                const response = await fetch('/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                document.getElementById('form-status').textContent = 
                    data.success ? 'Message sent successfully!' : 'Error sending message';
            } catch (error) {
                document.getElementById('form-status').textContent = 'Error sending message';
            }
            return false;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
    });

    it('should submit form with valid data', async () => {
        // Fill form
        document.getElementById('name').value = 'Test User';
        document.getElementById('email').value = 'test@example.com';
        document.getElementById('subject').value = 'Test Subject';
        document.getElementById('message').value = 'Test Message';

        // Submit form
        await global.sendEmail(new Event('submit'));

        // Verify fetch was called with correct data
        expect(fetchMock).toHaveBeenCalledWith(
            '/send-email',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Test User',
                    email: 'test@example.com',
                    subject: 'Test Subject',
                    message: 'Test Message'
                })
            })
        );
    });

    it('should handle form submission errors', async () => {
        // Mock error response
        fetchMock.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

        // Fill form
        document.getElementById('name').value = 'Test User';
        document.getElementById('email').value = 'test@example.com';
        document.getElementById('subject').value = 'Test Subject';
        document.getElementById('message').value = 'Test Message';

        // Submit form
        await global.sendEmail(new Event('submit'));

        // Verify error handling
        expect(document.getElementById('form-status').textContent).toBe('Error sending message');
    });

    it('should validate required fields', () => {
        // Try to submit empty form
        form.dispatchEvent(new Event('submit'));

        // Check HTML5 validation
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const subjectInput = document.getElementById('subject');
        const messageInput = document.getElementById('message');

        expect(nameInput.validity.valid).toBe(false);
        expect(emailInput.validity.valid).toBe(false);
        expect(subjectInput.validity.valid).toBe(false);
        expect(messageInput.validity.valid).toBe(false);
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
        it(`should accept valid email format: ${email}`, () => {
            expect(isValidEmail(email)).toBe(true);
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
        it(`should reject invalid email format (${desc}): ${email}`, () => {
            expect(isValidEmail(email)).toBe(false);
        });
    });
});
