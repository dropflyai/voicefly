# Maya Chatbot Auto-Open Feature

## Overview
Maya (the DashboardAssistant chatbot) now automatically opens for new users to proactively help with onboarding.

## How It Works

### Trigger Conditions
Maya auto-opens when ALL of the following are true:
1. User is on the main dashboard page (`/dashboard`)
2. User has NO phone employees created (onboarding step 1)
3. User hasn't seen the welcome message in the last 24 hours (or it's forced via prop)

### Behavior
- **Delay**: 3 seconds after page load
- **Frequency**: Once per 24 hours per device (using localStorage)
- **Message**: "Hi! I'm Maya. Let's get your first AI employee set up. What type of business do you run?"
- **Quick Actions**: Industry-specific buttons (restaurant, salon/spa, medical practice, other)

### Non-Intrusive Design
- Only triggers on main dashboard, not on other pages
- Won't spam users who navigate away and come back
- Users can close it anytime
- Respects manual close - won't reopen on same page
- After 24 hours, will show again if still on step 1

## Implementation Files

### Modified Files
1. **`/Users/dropfly/Projects/voicefly/src/components/DashboardAssistant.tsx`**
   - Added `autoOpenForNewUser` prop
   - Added auto-open logic with 3-second delay
   - Added localStorage tracking (`maya_welcome_seen`)
   - Updated step 1 greeting and quick actions

2. **`/Users/dropfly/Projects/voicefly/src/app/dashboard/layout.tsx`**
   - Made client-side component
   - Passes `autoOpenForNewUser={true}` only on `/dashboard` page
   - Uses pathname detection to control when auto-open is allowed

### Key Functions
- `hasSeenWelcomeRecently()`: Checks if user saw welcome in last 24 hours
- `markWelcomeSeen()`: Sets timestamp in localStorage
- Auto-open effect: Runs after onboarding data loads

## Testing

### Test Auto-Open Behavior

#### For New Users (Should Auto-Open)
1. Clear localStorage: `localStorage.removeItem('maya_welcome_seen')`
2. Delete all phone employees from database (or use test account with 0 employees)
3. Navigate to `/dashboard`
4. Wait 3 seconds
5. Maya should auto-open with the setup message

#### For Returning Users (Should NOT Auto-Open)
1. Already have `maya_welcome_seen` timestamp less than 24 hours old
2. Navigate to `/dashboard`
3. Maya should NOT auto-open

#### Force Reset (For Testing)
```javascript
// In browser console
localStorage.removeItem('maya_welcome_seen')
// Reload page
```

#### Check Current State
```javascript
// In browser console
localStorage.getItem('maya_welcome_seen')
// Returns ISO timestamp or null
```

### Test Pages
- **Should auto-open**: `/dashboard` (only if conditions met)
- **Should NOT auto-open**: `/dashboard/employees`, `/dashboard/settings`, etc.

## User Flow

1. **New user arrives at dashboard**
   - Sees dashboard UI load
   - After 3 seconds, Maya chatbot opens automatically
   - Greeting asks about business type
   - Quick action buttons for common industries

2. **User interacts with Maya**
   - Can ask questions about setup
   - Can click quick action to specify business type
   - Maya guides through employee creation

3. **User closes Maya**
   - Timestamp saved to localStorage
   - Won't reopen on this visit

4. **User returns within 24 hours**
   - Maya button visible but doesn't auto-open
   - User can click to open manually

5. **User returns after 24 hours (still no employees)**
   - Maya auto-opens again (gentle reminder)

## Edge Cases Handled

1. **Multiple tabs**: Each tab tracks independently via ref
2. **Fast navigation**: Timer cleanup prevents double-open
3. **Missing data**: Gracefully handles missing onboarding data
4. **Already onboarded**: Skips auto-open if step != 1
5. **Sub-pages**: Only activates on main dashboard

## Configuration

### Adjust Auto-Open Delay
In `DashboardAssistant.tsx` line 128:
```typescript
const timer = setTimeout(() => {
  setIsOpen(true)
  markWelcomeSeen()
}, 3000) // Change 3000 to desired milliseconds
```

### Adjust Frequency Window
In `DashboardAssistant.tsx` line 144:
```typescript
const hoursSince = (now - lastSeenTime) / (1000 * 60 * 60)
return hoursSince < 24 // Change 24 to desired hours
```

### Customize Greeting
In `DashboardAssistant.tsx` line 31:
```typescript
case 1:
  return "Hi! I'm Maya. Let's get your first AI employee set up. What type of business do you run?"
```

### Customize Quick Actions
In `DashboardAssistant.tsx` line 44:
```typescript
case 1:
  return ["I run a restaurant", "I run a salon/spa", "I run a medical practice", "Other business type"]
```

## Future Enhancements

Potential improvements:
- Track which quick action was clicked for analytics
- Different messages for different business types
- Progressive disclosure (step 2, 3 auto-opens)
- A/B test different timings
- Backend preference to disable auto-open
- Celebrate when user completes onboarding

## Troubleshooting

### Maya doesn't auto-open
- Check onboarding step: Should be 1 (no employees)
- Check localStorage: `maya_welcome_seen` should be null or >24h old
- Check page: Must be exactly `/dashboard`
- Check console for errors

### Maya auto-opens too often
- Check `hasSeenWelcomeRecently()` logic
- Verify localStorage is being written
- Check if cookies/storage is being cleared

### Maya opens on wrong pages
- Verify `pathname === '/dashboard'` check in layout
- Ensure `autoOpenForNewUser` prop is only true on main dashboard
