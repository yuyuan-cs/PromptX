# PromptX Web UI

Modern web interface for PromptX - AI Role & Tool Management Platform.

## Features

- 🎭 **Role Management**: Browse, search, and activate AI expert roles
- 🔧 **Tool Explorer**: Discover and manage available tools
- 📁 **Project Integration**: Bind projects to access project-specific resources
- 🧠 **Memory Network**: Store and recall knowledge using the cognitive memory system
- 🎨 **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6

## Development

### Prerequisites

- Node.js >= 14.0.0
- pnpm (recommended)

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start development server:
```bash
pnpm dev
```

The web UI will be available at `http://localhost:3000`.

### API Connection

The web UI connects to the PromptX MCP server running on `http://127.0.0.1:5203`. Make sure the server is running before using the web UI.

You can start the server using:
- PromptX Desktop app (recommended)
- CLI: `npx @promptx/mcp-server`
- Docker: `docker run -p 5203:5203 deepracticexs/promptx:latest`

## Building

Build the web UI for production:

```bash
pnpm build
```

The built files will be in the `dist` directory and can be served by any static file server.

## Project Structure

```
apps/web/
├── src/
│   ├── components/     # Reusable UI components
│   │   └── Layout.tsx  # Main layout with sidebar
│   ├── pages/          # Page components
│   │   ├── HomePage.tsx
│   │   ├── RolesPage.tsx
│   │   ├── ToolsPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   └── MemoryPage.tsx
│   ├── lib/            # Core utilities
│   │   ├── api.ts      # API client
│   │   └── store.ts    # Global state
│   ├── hooks/          # Custom React hooks
│   │   └── usePromptX.ts
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx         # Root component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Integration with Desktop App

The web UI is automatically bundled with the PromptX desktop application. When building the desktop app, the web UI is:

1. Built using `pnpm build` in the web directory
2. Packaged into the `resources/web` folder
3. Loaded by the desktop app's Web UI window

Users can access it via the tray menu: **Open Web UI**

## Pages Overview

### Home
- Overview of available resources
- Quick statistics
- Getting started guide

### Roles
- Browse all available AI roles
- Filter by source (system/project/user)
- Search by name or description
- Activate roles with one click

### Tools
- Explore available tools
- View tool parameters and documentation
- Search functionality

### Projects
- Bind project directories
- View active project
- Access project-specific resources

### Memory
- Store new memories with keywords
- Recall memories by keyword search
- View memory network connections

## License

MIT