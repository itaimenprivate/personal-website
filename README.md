# Personal Website

![CI Status](https://github.com/itaimenprivate/personal-website/workflows/CI/badge.svg)

A personal website with a contact form that sends emails using Node.js and Nodemailer.

## Features
- Contact form with email functionality
- Input validation
- Modern UI design
- Comprehensive test suite

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation
```bash
npm install
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Environment Variables
Create a `.env` file with the following variables:
```
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your-app-specific-password
NODE_ENV=development
```

## Continuous Integration
This project uses GitHub Actions for CI/CD:
- Runs tests on Node.js v16, v18, and v20
- Generates test coverage reports
- Automatically deploys to Render on successful main branch builds

## Deployment
The application is deployed on Render.com. Each push to the main branch triggers:
1. Test suite execution
2. Coverage report generation
3. Automatic deployment if all tests pass
