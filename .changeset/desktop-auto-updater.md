---
"@promptx/desktop": minor
---

feat: implement auto-updater mechanism for PromptX desktop app

Added comprehensive auto-updater functionality using electron-updater with GitHub Releases integration.

**Key Features:**
- Automatic update checking on app startup (3 seconds delay)
- Manual update checking via system tray menu
- User-controlled download and installation process
- Support for skipping specific versions
- Development mode detection with appropriate messaging

**User Experience:**
- Non-intrusive background update checking
- Clear dialogs with PromptX branding instead of system notifications
- Three-option update flow: "Download Now", "Remind Me Later", "Skip This Version"
- Automatic architecture detection (Intel/Apple Silicon/Universal on macOS)
- Update status reflected in system tray menu

**Technical Implementation:**
- Integration with existing Clean Architecture pattern
- UpdateManager class following SOLID principles
- Proper error handling and logging throughout
- GitHub Releases as update distribution channel
- Support for multi-platform builds (macOS x64/arm64/universal, Windows setup/portable, Linux AppImage/deb/rpm)

**Configuration Updates:**
- Updated electron-builder.yml for multi-architecture builds
- Fixed GitHub Actions workflow for proper artifact generation
- Added metadata files (latest-mac.yml, latest.yml, latest-linux.yml) for update detection
- Configured publish settings for GitHub provider

**Security & Reliability:**
- Disabled auto-download - requires explicit user consent
- Version validation and checksum verification
- Graceful fallback for network/server errors
- Development mode safeguards

This implements the high-priority feature request from issue #305, providing users with seamless update experience while maintaining full control over when updates are downloaded and installed.