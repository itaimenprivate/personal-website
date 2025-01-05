/**
 * @jest-environment jsdom
 */

describe('Contact Form Functionality', () => {
    let form;
    let submitButton;
    let fetchMock;

    beforeEach(() => {
        // Set up our document body
        document.body.innerHTML = `
            <form id="contact-form">
                <input type="text" id="name" name="name" required>
                <input type="email" id="email" name="email" required>
                <input type="text" id="subject" name="subject" required>
                <textarea id="message" name="message" required></textarea>
                <button type="submit" id="submit-btn">Send Message</button>
                <div id="form-status"></div>
            </form>
        `;

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
});
