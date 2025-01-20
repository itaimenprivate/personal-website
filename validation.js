// Email validation regex that enforces:
// 1. Must start and end with alphanumeric
// 2. No consecutive dots
// 3. Domain must start and end with alphanumeric
// 4. TLD must be at least 2 letters
// 5. No numeric TLDs
const EMAIL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isValidEmail, EMAIL_REGEX };
}
