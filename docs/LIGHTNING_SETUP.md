# Lightning-Fast Setup Guide ⚡

Get your React Starter Kit running in **under 30 minutes** with this streamlined setup process.

## 🎯 Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Git installed and configured
- [ ] A modern code editor (VS Code recommended)

## 🚀 Phase 1: Account Setup (10 minutes)

### Step 1: Create Your Clerk Account
1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Choose your authentication providers (Google, GitHub, etc.)
4. Copy your publishable and secret keys

### Step 2: Create Your Convex Account  
1. Go to [convex.dev](https://convex.dev) and sign up
2. Create a new project
3. Note your deployment name and URL

### Step 3: Set Up Clerk Billing
1. In your Clerk dashboard, navigate to Billing
2. Connect your Stripe account
3. Copy your billing keys
4. Set up webhook endpoint (we'll configure this later)

## ⚡ Phase 2: Lightning Setup (15 minutes)

### Option A: Automated Setup (Recommended)

Run our automated setup script:

```bash
# Clone and setup in one command
npx create-react-starter-kit@latest my-saas-app
cd my-saas-app
npm run setup
```

The setup script will:
- Install all dependencies
- Guide you through environment configuration
- Set up Convex deployment
- Configure Clerk integration
- Verify all connections

### Option B: Manual Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/react-starter-kit.git my-saas-app
cd my-saas-app

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Run setup wizard
npm run setup:wizard
```

## 🔧 Phase 3: Environment Configuration (5 minutes)

### Auto-Configuration
If you used the automated setup, your environment is already configured. Skip to verification.

### Manual Configuration
Edit your `.env.local` file with your account details:

```bash
# Convex Configuration
CONVEX_DEPLOYMENT=your-deployment-name
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Billing
CLERK_BILLING_SECRET_KEY=sk_billing_...
CLERK_BILLING_PUBLISHABLE_KEY=pk_billing_...
CLERK_BILLING_WEBHOOK_SECRET=whsec_...

# OpenAI (for AI chat features)
OPENAI_API_KEY=sk-...

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## ✅ Phase 4: Verification & Testing

### Automated Verification
```bash
npm run verify:setup
```

This command checks:
- [ ] All environment variables are set
- [ ] Clerk authentication works
- [ ] Convex database connection
- [ ] Clerk Billing integration
- [ ] OpenAI API connection

### Manual Verification Steps

1. **Start Development Servers**
   ```bash
   # Terminal 1: Start frontend
   npm run dev
   
   # Terminal 2: Start Convex backend
   npx convex dev
   ```

2. **Test Authentication**
   - Visit http://localhost:5173
   - Click "Sign Up" and create a test account
   - Verify you can sign in and out

3. **Test Database Connection**
   - Sign in to your test account
   - Visit the dashboard
   - Verify user data appears

4. **Test Billing Integration**
   - Visit the pricing page
   - Start a subscription flow (use Stripe test cards)
   - Verify subscription status updates

## 🛠️ Automated Setup Scripts

### Setup Wizard Script
Create this as `scripts/setup-wizard.js`:

```javascript
#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupWizard() {
  console.log('🚀 Welcome to React Starter Kit Setup!');
  console.log('This wizard will configure your environment in minutes.\n');

  const config = {};

  // Clerk Configuration
  console.log('📝 Clerk Configuration');
  config.VITE_CLERK_PUBLISHABLE_KEY = await ask('Enter your Clerk Publishable Key: ');
  config.CLERK_SECRET_KEY = await ask('Enter your Clerk Secret Key: ');
  config.CLERK_BILLING_SECRET_KEY = await ask('Enter your Clerk Billing Secret Key: ');
  config.CLERK_BILLING_PUBLISHABLE_KEY = await ask('Enter your Clerk Billing Publishable Key: ');
  config.CLERK_BILLING_WEBHOOK_SECRET = await ask('Enter your Clerk Billing Webhook Secret: ');

  // Convex Configuration  
  console.log('\n🗄️ Convex Configuration');
  config.CONVEX_DEPLOYMENT = await ask('Enter your Convex Deployment Name: ');
  config.VITE_CONVEX_URL = `https://${config.CONVEX_DEPLOYMENT}.convex.cloud`;

  // Optional configurations
  console.log('\n🤖 Optional: OpenAI Configuration');
  config.OPENAI_API_KEY = await ask('Enter your OpenAI API Key (or press Enter to skip): ');

  config.FRONTEND_URL = 'http://localhost:5173';

  // Write environment file
  const envContent = Object.entries(config)
    .filter(([key, value]) => value)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync('.env.local', envContent);
  console.log('\n✅ Environment configuration saved!');

  // Initialize Convex
  console.log('\n🔄 Initializing Convex...');
  try {
    execSync('npx convex dev --once', { stdio: 'inherit' });
    console.log('✅ Convex initialized successfully!');
  } catch (error) {
    console.error('❌ Convex initialization failed:', error.message);
  }

  console.log('\n🎉 Setup complete! Run "npm run dev" to start developing.');
  rl.close();
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

setupWizard().catch(console.error);
```

### Verification Script
Create this as `scripts/verify-setup.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

async function verifySetup() {
  console.log('🔍 Verifying React Starter Kit setup...\n');

  let allPassed = true;

  // Check environment file
  const envExists = fs.existsSync('.env.local');
  logCheck('Environment file exists', envExists);
  if (!envExists) allPassed = false;

  if (envExists) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const requiredVars = [
      'CONVEX_DEPLOYMENT',
      'VITE_CONVEX_URL', 
      'VITE_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'CLERK_BILLING_SECRET_KEY'
    ];

    for (const varName of requiredVars) {
      const hasVar = envContent.includes(`${varName}=`);
      logCheck(`${varName} configured`, hasVar);
      if (!hasVar) allPassed = false;
    }
  }

  // Test Convex connection
  try {
    const convexUrl = process.env.VITE_CONVEX_URL;
    if (convexUrl) {
      await testUrl(`${convexUrl}/api/ping`);
      logCheck('Convex connection', true);
    }
  } catch (error) {
    logCheck('Convex connection', false);
    allPassed = false;
  }

  // Test Clerk configuration
  const clerkKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (clerkKey && clerkKey.startsWith('pk_')) {
    logCheck('Clerk publishable key format', true);
  } else {
    logCheck('Clerk publishable key format', false);
    allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 All checks passed! Your setup is ready.');
    console.log('Run "npm run dev" to start developing.');
  } else {
    console.log('❌ Some checks failed. Please review the errors above.');
    console.log('Refer to docs/LIGHTNING_SETUP.md for troubleshooting.');
  }
}

function logCheck(description, passed) {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${description}`);
}

function testUrl(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    request.on('error', reject);
    request.setTimeout(5000, () => reject(new Error('Timeout')));
  });
}

verifySetup().catch(console.error);
```

## 🔧 Quick Commands Reference

```bash
# Development
npm run dev                  # Start development server
npx convex dev              # Start Convex backend

# Setup & Verification  
npm run setup               # Run setup wizard
npm run verify:setup        # Verify configuration
npm run reset:env           # Reset environment file

# Database
npm run db:reset            # Reset Convex database
npm run db:seed             # Seed with sample data

# Testing
npm run test:auth           # Test authentication flow
npm run test:billing        # Test billing integration
npm run test:e2e            # Run end-to-end tests
```

## 🆘 Common Issues & Solutions

### "Convex deployment not found"
```bash
# Reinitialize Convex
npx convex dev --reset
```

### "Clerk authentication failing"
- Verify publishable key starts with `pk_`
- Check that secret key starts with `sk_`  
- Ensure keys match your Clerk application

### "Billing webhook not receiving events"
- Verify webhook URL in Clerk dashboard
- Check webhook secret matches `.env.local`
- Ensure frontend URL is accessible

### "OpenAI API not working"
- Verify API key starts with `sk-`
- Check API key has sufficient credits
- Ensure OpenAI API key is active

## 📞 Getting Help

### Quick Debugging
```bash
npm run debug:env           # Show environment status
npm run debug:connections   # Test all connections
npm run logs:convex         # View Convex logs
npm run logs:clerk          # View Clerk logs
```

### Documentation Links
- [Clerk Documentation](https://clerk.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [React Router Documentation](https://reactrouter.com)

### Support Resources
- GitHub Issues: [Project Issues](https://github.com/your-org/react-starter-kit/issues)
- Discord Community: [Join Discord](https://discord.gg/your-server)
- Email Support: support@your-domain.com

## 🏁 Next Steps

Once your setup is verified:

1. **Explore the Codebase** - Review `docs/SAFE_CUSTOMIZATION_ZONES.md`
2. **Customize the Design** - Start with `app/components/homepage/`
3. **Add Your Features** - Follow patterns in `docs/FEATURE_DEVELOPMENT.md` 
4. **Deploy to Production** - Use `docs/PRODUCTION_DEPLOYMENT.md`

**Time to Ship:** You're now ready to build your SaaS! Focus on your unique features while the foundation handles authentication, database, and billing. 🚀