This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Connection
MONGO_URI=your_mongodb_connection_string

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_key

# Gmail Email Configuration for Password Reset
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
```

**Setting up Gmail for Password Reset:**
1. Go to your Google Account settings
2. Enable 2-Step Verification if not already enabled
3. Go to App Passwords: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Copy the 16-character password and use it as `EMAIL_PASS`

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

## Features

### Password Reset System
- **Forgot Password Flow**: Users can reset their password via email
- **OTP Verification**: Secure 6-digit OTP sent to registered email
- **Email Integration**: Uses Gmail SMTP for free email delivery
- **Secure Password Reset**: OTP expires in 15 minutes for security
- **Multi-step UI**: Clean, user-friendly 3-step process (Email → OTP → New Password)

**How it works:**
1. User clicks "Forgot Password?" on the login page
2. Enters their registered email address
3. Receives a 6-digit OTP via email
4. Verifies the OTP
5. Sets a new password

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
