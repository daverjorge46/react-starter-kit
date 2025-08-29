# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

```bash
# Development
npm run dev                  # Start development server with HMR
npx convex dev              # Run Convex backend in development

# Production
npm run build               # Build for production
npm run start               # Start production server
npm run typecheck           # Run TypeScript type checking
```

## Tech Stack

This is a **React Starter Kit (RSK)** - a production-ready SaaS template built with:

### Core Framework
- **React Router v7** - Full-stack React framework with SSR
- **TypeScript** - Type safety throughout the application
- **Vite** - Fast development and build tool
- **TailwindCSS v4** - Utility-first CSS framework

### Backend & Services
- **Convex** - Real-time database and serverless functions
- **Clerk** - Authentication and user management 
- **Clerk Billing** - Subscription billing and payments
- **OpenAI** - AI chat capabilities

### UI Components
- **shadcn/ui** - Modern component library with Radix UI
- **Lucide React & Tabler Icons** - Icon libraries
- **Motion** - Animation library
- **Recharts** - Data visualization

## Architecture Overview

### App Structure
- `app/` - React Router application code
  - `components/` - Reusable UI components
    - `ui/` - shadcn/ui components
    - `homepage/` - Homepage-specific components
    - `dashboard/` - Dashboard-specific components
  - `routes/` - React Router routes and pages
  - `lib/` - Utility functions and configurations
- `convex/` - Convex backend functions and schema
- `public/` - Static assets

### Key Routes
- `/` - Homepage with pricing
- `/pricing` - Dynamic pricing page
- `/dashboard` - Protected user dashboard (requires active subscription)
- `/dashboard/chat` - AI-powered chat interface
- `/dashboard/settings` - User settings
- `/success` - Subscription success page
- `/webhook/polar` - Polar.sh webhook handler

### Authentication Flow
- Uses Clerk for authentication with SSR support
- Protected routes automatically redirect unauthenticated users to `/sign-in`
- Dashboard routes require active subscription, redirect to `/subscription-required` if none
- User data is synchronized between Clerk and Convex

### Subscription Management
- Polar.sh integration for billing and payments
- Real-time subscription status updates via webhooks
- Subscription status stored in Convex database
- Dynamic pricing fetched from Polar.sh API

### Database Schema (Convex)
- `users` - User profiles synced from Clerk
- `subscriptions` - Subscription data from Polar.sh
- `webhookEvents` - Webhook event logs

## Development Patterns

### Data Loading
- Use React Router's `loader` functions for server-side data fetching
- Leverage parallel data fetching to reduce waterfalls
- Example: `app/routes/dashboard/layout.tsx:21-26`

### Protected Routes
- Authentication check in loaders using `getAuth(args)`
- Subscription status validation for dashboard routes
- Redirect patterns for unauthenticated/unsubscribed users

### Component Organization
- Homepage components in `app/components/homepage/`
- Dashboard components in `app/components/dashboard/`
- Reusable UI components in `app/components/ui/`

### Styling Conventions
- TailwindCSS v4 with utility classes
- Component variants using `class-variance-authority`
- Consistent design system via shadcn/ui components

## Environment Variables

### Required for Development
```bash
# Convex Configuration
CONVEX_DEPLOYMENT=your_convex_deployment_here
VITE_CONVEX_URL=your_convex_url_here

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Polar.sh Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_ORGANIZATION_ID=your_polar_organization_id_here
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret_here

# OpenAI Configuration (for AI chat)
OPENAI_API_KEY=your_openai_api_key_here

# Frontend URL for redirects
FRONTEND_URL=http://localhost:5173
```

## Deployment

### Vercel (Recommended)
- Configured with `@vercel/react-router` preset in `react-router.config.ts`
- SSR enabled by default
- Automatic deployments on push to main

### Docker Support
- Dockerfile included for containerized deployment
- Compatible with AWS ECS, Google Cloud Run, Azure Container Apps, etc.

## AI Chat Integration

The application includes OpenAI-powered chat functionality:
- Real-time message streaming using `ai` SDK
- Chat interface in `/dashboard/chat`
- Messages persisted and managed through Convex

## Common Tasks

### Adding New Routes
1. Create route file in `app/routes/`
2. Add loader function if server-side data needed
3. Update navigation in sidebar components if needed

### Adding UI Components
1. Use shadcn/ui components from `app/components/ui/`
2. Follow existing patterns for component organization
3. Use TailwindCSS classes for styling

### Database Changes
1. Update schema in `convex/schema.ts`
2. Create or update Convex functions in `convex/`
3. Run `npx convex dev` to apply changes

### Webhook Handling
- Polar.sh webhooks handled in `convex/http.ts`
- Webhook events logged in `webhookEvents` table
- Subscription status automatically updated