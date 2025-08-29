# Sacred Boundaries: What NOT to Touch

## ⚠️ Critical Warning

The files and systems listed in this document are **SACRED BOUNDARIES** - they form the core foundation of your application. Modifying these can break authentication, corrupt data, or compromise billing integrity.

**Golden Rule:** When in doubt, DON't modify it. Focus on customization zones instead.

## 🚫 NEVER MODIFY: Core Integration Files

### Authentication System (Clerk)

#### Completely Off-Limits
```
app/lib/auth.server.ts         # Authentication utilities
app/root.tsx                   # ClerkApp wrapper (keep Clerk parts intact)
```

#### Modify with EXTREME Caution
```
app/routes/_index.tsx          # Homepage - can modify content, keep auth patterns
app/routes/dashboard/layout.tsx # Can modify UI, NEVER touch auth checks
```

**What you CAN do:**
- Customize login/signup page styling
- Add additional user profile fields in Clerk dashboard
- Modify redirect URLs after auth

**What you CANNOT do:**
- Change authentication flow logic
- Modify JWT handling
- Alter session management
- Remove auth checks from protected routes

### Database System (Convex)

#### Completely Off-Limits
```
convex/schema.ts              # Database schema - breaking changes not allowed
convex/users.ts               # User management functions
convex/subscriptions.ts       # Billing integration functions
convex/http.ts                # Webhook handlers for Clerk Billing
convex/auth.config.ts         # Authentication configuration
```

#### Safe Convex Modifications
```
convex/                       # You can ADD new files for your features
  ├── myFeature.ts           # ✅ Add new query/mutation functions
  ├── customLogic.ts         # ✅ Add business logic functions
  └── integrations.ts        # ✅ Add third-party integrations
```

**What you CAN do:**
- Add new tables to schema (non-breaking additions)
- Create new query/mutation functions for your features
- Add indexes for performance optimization
- Create custom actions for external API calls

**What you CANNOT do:**
- Modify existing table schemas (users, subscriptions, webhookEvents)
- Change existing function signatures
- Remove or alter webhook handling logic
- Modify authentication integration code

### Billing System (Clerk Billing)

#### Completely Off-Limits
```
convex/subscriptions.ts       # Subscription management functions
convex/http.ts                # Billing webhook handlers
app/routes/webhook/           # Webhook endpoints
```

#### Subscription-Related Routes (Modify Carefully)
```
app/routes/pricing.tsx        # Can modify UI, keep subscription logic intact
app/routes/success.tsx        # Can customize success messages
app/routes/dashboard/         # Can modify UI, NEVER remove subscription checks
```

**What you CAN do:**
- Customize pricing page design and copy
- Add additional subscription tiers in Clerk Billing dashboard
- Modify success/failure page content
- Add custom billing-related UI components

**What you CANNOT do:**
- Change webhook signature verification
- Modify subscription status logic
- Alter billing data synchronization
- Remove subscription requirement checks

## 🔒 Protected Configuration Files

### Environment Configuration
```
.env.example                  # Can modify - add your own variables
.env.local                    # Can modify - but keep required variables
```

**Required Environment Variables (DO NOT REMOVE):**
- `CONVEX_DEPLOYMENT`
- `VITE_CONVEX_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_BILLING_SECRET_KEY`
- `CLERK_BILLING_PUBLISHABLE_KEY`
- `CLERK_BILLING_WEBHOOK_SECRET`

### Build Configuration
```
convex.json                   # Convex configuration - modify with caution
react-router.config.ts        # Can add routes, keep SSR config
vite.config.ts               # Can add plugins, keep Convex integration
```

## ✅ SAFE CUSTOMIZATION ZONES

### Frontend Components
```
app/components/ui/            # Customize existing or add new components
app/components/homepage/      # Modify homepage components freely
app/components/dashboard/     # Modify dashboard UI (keep auth patterns)
```

### Styling and Assets
```
app/globals.css              # Customize global styles
public/                      # Add your own assets
tailwind.config.ts           # Customize Tailwind configuration
```

### New Features
```
app/routes/                  # Add new routes (follow auth patterns)
app/lib/                     # Add utility functions
convex/                      # Add new database functions
```

## 🛡️ Boundary Violation Detection

### Warning Signs You've Gone Too Far
- Authentication suddenly stops working
- Users can't access dashboard after login
- Subscription status not updating properly
- Webhook endpoints returning errors
- TypeScript errors in core integration files

### Emergency Recovery
If you accidentally modify sacred boundaries:

1. **Check Git History**
   ```bash
   git log --oneline convex/
   git checkout HEAD~1 convex/subscriptions.ts
   ```

2. **Verify Core Functions**
   ```bash
   npm run dev
   npx convex dev
   # Test authentication, dashboard access, and billing
   ```

3. **Reset Environment**
   ```bash
   rm -rf node_modules
   npm install
   npx convex dev --reset
   ```

## 🎯 Safe Development Patterns

### Adding New Database Features
```typescript
// ✅ CORRECT: Add new file
// convex/myNewFeature.ts
import { query } from "./_generated/server";
import { auth } from "./auth";

export const getMyData = query({
  args: {},
  handler: async (ctx) => {
    const user = await auth.getUserId(ctx);
    if (!user) throw new Error("Not authenticated");
    // Your custom logic here
  }
});
```

### Adding Protected Routes
```typescript
// ✅ CORRECT: Follow existing patterns
// app/routes/my-feature.tsx
import { LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";

export async function loader(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);
  if (!userId) {
    throw redirect("/sign-in");
  }
  // Your route logic here
}
```

### Extending User Data
```typescript
// ✅ CORRECT: Add to existing schema
// convex/schema.ts - ADD new tables, don't modify existing ones
export const myUserData = defineTable({
  userId: v.string(),
  customField: v.string(),
}).index("by_user", ["userId"]);
```

## 📞 When You Need Help

### Before Modifying Sacred Files
1. Check this documentation first
2. Search existing codebase for similar patterns
3. Create new files instead of modifying existing ones
4. Test thoroughly in development environment

### Red Flags That Require Expert Help
- Need to change authentication flow
- Subscription billing not working correctly
- Database schema needs breaking changes
- Webhook handlers failing
- Core TypeScript errors

Remember: The goal is rapid development on a solid foundation. When in doubt, build around the sacred boundaries rather than through them.