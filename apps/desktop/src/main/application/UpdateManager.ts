import { updateElectronApp } from 'update-electron-app'
import { dialog, app, nativeImage } from 'electron'
import * as logger from '@promptx/logger'
import * as path from 'node:path'

export class UpdateManager {
  private appIcon: Electron.NativeImage | undefined

  constructor() {
    this.loadAppIcon()
    this.setupUpdater()
  }

  private loadAppIcon(): void {
    try {
      const iconPath = path.join(__dirname, '../../assets/icons/icon-128x128.png')
      this.appIcon = nativeImage.createFromPath(iconPath)
      logger.info('UpdateManager: App icon loaded successfully')
    } catch (error) {
      logger.error('UpdateManager: Failed to load app icon:', error)
    }
  }

  private setupUpdater(): void {
    // Only enable auto-updater for packaged apps
    if (!app.isPackaged) {
      logger.info('UpdateManager: Skipping auto-updater setup in development mode')
      return
    }

    try {
      // Simple setup with update-electron-app
      updateElectronApp({
        repo: 'Deepractice/PromptX',
        updateInterval: '1 hour'
      })
      
      logger.info('UpdateManager: Auto-updater initialized with update-electron-app')
    } catch (error) {
      logger.error('UpdateManager: Failed to initialize auto-updater:', error)
    }
  }

  // Check for updates on startup (simplified)
  async checkForUpdates(): Promise<void> {
    if (app.isPackaged) {
      logger.info('UpdateManager: Auto-updater is running, updates will be checked automatically')
    } else {
      logger.info('UpdateManager: Skipping update check in development mode')
    }
  }

  // Manual check for updates (from tray menu) - simplified
  async checkForUpdatesManual(): Promise<void> {
    logger.info('UpdateManager: Manual update check called')
    
    if (!app.isPackaged) {
      this.showDevModeNotification()
      return
    }

    // For update-electron-app, manual checking is handled automatically
    // Just show a message that updates are being checked in the background
    dialog.showMessageBox({
      type: 'info',
      title: 'PromptX Update Check',
      message: 'Checking for Updates',
      detail: 'PromptX is checking for updates in the background. You will be notified if an update is available.',
      buttons: ['OK'],
      icon: this.appIcon
    })
  }

  private showDevModeNotification(): void {
    logger.info('UpdateManager: Showing dev mode dialog')
    dialog.showMessageBox({
      type: 'info',
      title: 'PromptX Development Mode',
      message: 'Update Check',
      detail: 'Auto-updater is disabled in development mode.\n\nTo test updates, build and package the app first.',
      buttons: ['OK'],
      icon: this.appIcon
    }).then(() => {
      logger.info('UpdateManager: Dev mode dialog closed')
    }).catch((error) => {
      logger.error('UpdateManager: Error showing dev mode dialog:', error)
    })
  }

  // Legacy methods for tray menu compatibility
  isUpdateAvailable(): boolean {
    // update-electron-app handles this internally
    return false
  }

  onUpdateAvailable(_callback: () => void): void {
    // update-electron-app handles this internally
    logger.info('UpdateManager: onUpdateAvailable callback registered (handled by update-electron-app)')
  }
}