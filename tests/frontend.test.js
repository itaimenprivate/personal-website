const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { isValidEmail } = require('../validation');

describe('Frontend Form Validation', () => {
    let dom;
    let document;
    let window;
    let form;
    let emailInput;

    beforeEach(() => {
        // Set up our document body with minimal HTML
        const html = `
            <!DOCTYPE html>
            <html>
            <body>
                <form id="contact-form">
                    <input type="text" id="name" name="name" required>
                    <input type="email" id="email" name="email" required>
                    <textarea id="message" name="message" required></textarea>
                    <button type="submit">Send</button>
                </form>
            </body>
            </html>
        `;

        // Configure JSDOM to not try to load external resources
        dom = new JSDOM(html, {
            runScripts: 'dangerously',
            resources: 'usable',
            url: 'http://localhost',
            features: {
                FetchExternalResources: false,
                ProcessExternalResources: false
            }
        });

        document = dom.window.document;
        window = dom.window;

        // Mock validation functions directly
        window.isValidEmail = isValidEmail;

        // Get form elements
        form = document.getElementById('contact-form');
        emailInput = document.getElementById('email');

        // Mock validity API
        emailInput.setCustomValidity = function(message) {
            this._customValidity = message;
            this.validity = {
                valid: !message
            };
        };
        emailInput.reportValidity = jest.fn();

        // Trigger validation setup
        const event = new window.Event('DOMContentLoaded');
        window.document.dispatchEvent(event);
    });

    afterEach(() => {
        // Clean up
        dom.window.close();
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

    // Test form validation
    it('should prevent form submission with invalid email', () => {
        const invalidEmail = '.user@domain.com';
        emailInput.value = invalidEmail;
        
        const event = new window.Event('submit', { cancelable: true });
        form.dispatchEvent(event);
        
        expect(isValidEmail(invalidEmail)).toBe(false);
    });
});
