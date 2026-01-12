# @sms-stories/editor

Story editor package for sms-Stories platform with support for rich text, SMS-style conversations, and media chapters.

## Features

- 📝 **Rich Text Editor** - TipTap-based WYSIWYG editor with formatting tools
- 💬 **SMS Chapter Editor** - Create realistic SMS conversation threads
- 🖼️ **Media Editor** - Image and video chapters support
- 🎨 **Character Management** - Define story characters with avatars
- 💾 **Autosave** - Automatic draft saving with status indicators
- 🔒 **Server Functions** - Type-safe server actions for all operations
- ✅ **Validation** - Built-in input validation with Valibot

## Installation

```bash
pnpm add @sms-stories/editor
```

## Usage

### Basic Setup

```typescript
import { StoryEditorClient } from '@sms-stories/editor'

export default function EditorPage({ params }: { params: { storyId: string } }) {
  return <StoryEditorClient storyId={params.storyId} />
}
```

**⚠️ Note on Hooks**: Hooks are client-only and NOT exported from the main package. Import them from `@sms-stories/editor/hooks` in Client Components only.

### Using Actions

```typescript
import { createStoryAction, updateStoryAction } from '@sms-stories/editor/actions'

// Create a story
const result = await createStoryAction(null, formData)

// Update a story
const updated = await updateStoryAction(storyId, {
  title: 'New Title',
  description: 'New description'
})
```

### Using Services

**New Pattern (Recommended):**

```typescript
import { creatorStoryService } from '@sms-stories/editor/services'
import '@/lib/pocketbase' // Important: ensures initialization

// Use singleton directly - no instantiation needed
const story = await creatorStoryService.getStoryById(storyId)
const stories = await creatorStoryService.getUserStories(userId)
```

**Legacy Pattern (Still Supported):**

```typescript
import { CreatorStoryService } from '@sms-stories/editor/services'
import '@/lib/pocketbase'

const storyService = new CreatorStoryService()
const story = await storyService.getStoryById(storyId)
```

See [MIGRATION_SERVICE_PATTERN.md](./MIGRATION_SERVICE_PATTERN.md) for details.

## Configuration

### PocketBase Initialization

Before using services, you must initialize PocketBase once in your app:

```typescript
// lib/pocketbase.ts
import PocketBase from 'pocketbase'
import { initializePocketBase } from '@sms-stories/editor/lib'

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)

// Your configuration
pb.autoCancellation(false)
if (process.env.POCKETBASE_TOKEN) {
  pb.authStore.save(process.env.POCKETBASE_TOKEN, null)
}

// Initialize the editor package
initializePocketBase(pb)
```

Then in your pages/components, just import the file to ensure initialization:

```typescript
import '@/lib/pocketbase' // Ensures PocketBase is initialized
import { creatorStoryService } from '@sms-stories/editor/services'

// Use services directly
const stories = await creatorStoryService.getUserStories(userId)
```

### Next.js Configuration

Add to `next.config.mjs`:

```javascript
const nextConfig = {
  transpilePackages: ['@sms-stories/editor'],
}
```

### TypeScript Configuration

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@sms-stories/editor": ["./packages/editor/src"],
      "@sms-stories/editor/*": ["./packages/editor/src/*"]
    }
  }
}
```

### Tailwind Configuration

Add to `tailwind.config.ts`:

```javascript
export default {
  content: [
    './packages/editor/src/**/*.{ts,tsx}',
    // ... other paths
  ]
}
```

## Dependencies

### Required Peer Dependencies

- `better-auth` ^1.4.0 - Authentication
- `next` ^15.0.0 || ^16.0.0 - Next.js framework
- `react` ^19.0.0 - React
- `react-dom` ^19.0.0 - React DOM

### Backend Requirements

- PocketBase with collections: `c_stories`, `c_chapters`, `c_blocks`, `images`
- Better Auth configured with PocketBase adapter

## License

MIT
