import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { dialog, app, nativeImage } from 'electron'
import * as logger from '@promptx/logger'
import * as path from 'node:path'

export class UpdateManager {
  private updateAvailable = false
  private updateInfo: any = null
  private onUpdateAvailableCallback?: () => void
  private appIcon: Electron.NativeImage | undefined

  constructor() {
    this.setupUpdater()
    this.loadAppIcon()
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
    // Configure update feed - GitHub Releases
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'Deepractice',
      repo: 'PromptX'
    })

    // Set up event listeners
    autoUpdater.on('checking-for-update', () => {
      logger.info('Checking for updates...')
    })

    autoUpdater.on('update-available', (info) => {
      logger.info(`Update available: ${info.version}`)
      this.updateAvailable = true
      this.updateInfo = info
      this.showUpdateNotification(info)
      this.onUpdateAvailableCallback?.()
    })

    autoUpdater.on('update-not-available', () => {
      logger.info('No updates available')
    })

    autoUpdater.on('error', (error) => {
      logger.error('Update error:', error)
    })

    autoUpdater.on('download-progress', (progress) => {
      logger.info(`Update download progress: ${Math.round(progress.percent)}%`)
    })

    autoUpdater.on('update-downloaded', (info) => {
      logger.info(`Update downloaded: ${info.version}`)
      this.showInstallDialog(info)
    })

    // Disable auto-download - let user decide
    autoUpdater.autoDownload = false
  }

  // Check for updates on startup (non-blocking)
  async checkForUpdates(): Promise<void> {
    try {
      if (app.isPackaged) {
        await autoUpdater.checkForUpdates()
      } else {
        logger.info('Skipping update check in development mode')
      }
    } catch (error) {
      logger.error('Failed to check for updates:', error)
    }
  }

  // Manual check for updates (from tray menu)
  async checkForUpdatesManual(): Promise<void> {
    logger.info('UpdateManager: checkForUpdatesManual called')
    try {
      if (!app.isPackaged) {
        logger.info('UpdateManager: App is not packaged, showing dev mode notification')
        this.showDevModeNotification()
        return
      }

      // If we already know about an available update, show download dialog directly
      if (this.updateAvailable && this.updateInfo) {
        logger.info('UpdateManager: Update already available, showing download dialog')
        this.showUpdateNotification(this.updateInfo)
        return
      }

      logger.info('UpdateManager: App is packaged, checking for updates...')
      const result = await autoUpdater.checkForUpdates()
      logger.info('UpdateManager: checkForUpdates result:', result)
      
      if (!result?.updateInfo || !this.updateAvailable) {
        logger.info('UpdateManager: No updates available, showing dialog')
        dialog.showMessageBox({
          type: 'info',
          title: 'PromptX Update Check',
          message: 'No Updates Available',
          detail: 'You are running the latest version of PromptX.',
          buttons: ['OK'],
          icon: this.appIcon
        })
      } else {
        logger.info('UpdateManager: Update is available')
      }
    } catch (error) {
      logger.error('UpdateManager: Manual update check failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      dialog.showMessageBox({
        type: 'error',
        title: 'PromptX Update Error',
        message: 'Update Check Failed',
        detail: `Failed to check for updates: ${errorMessage}\n\nPlease try again later.`,
        buttons: ['OK'],
        icon: this.appIcon
      })
    }
  }

  // Start download when user clicks on update notification
  async downloadUpdate(): Promise<void> {
    try {
      logger.info('Starting update download...')
      await autoUpdater.downloadUpdate()
    } catch (error) {
      logger.error('Failed to download update:', error)
    }
  }

  private showUpdateNotification(info: any): void {
    dialog.showMessageBox({
      type: 'info',
      title: 'PromptX Update Available',
      message: `Version ${info.version} is available!`,
      detail: 'A new version of PromptX is ready to download.',
      buttons: ['Download Now', 'Remind Me Later', 'Skip This Version'],
      defaultId: 0,
      cancelId: 1,
      icon: this.appIcon
    }).then((result) => {
      if (result.response === 0) {
        // Download Now
        this.downloadUpdate()
      } else if (result.response === 2) {
        // Skip This Version
        logger.info(`User chose to skip version ${info.version}`)
        this.updateAvailable = false
        this.updateInfo = null
        this.onUpdateAvailableCallback?.() // Refresh tray menu
      }
      // Remind Me Later - do nothing, keep updateAvailable = true
    })
  }

  private showInstallDialog(info: any): void {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: `PromptX ${info.version} has been downloaded.`,
      detail: 'Click "Restart Now" to install the update and restart the application.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      icon: this.appIcon
    }).then((result) => {
      if (result.response === 0) {
        logger.info('User chose to restart and install update')
        autoUpdater.quitAndInstall()
      } else {
        logger.info('User chose to install update later')
      }
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

  isUpdateAvailable(): boolean {
    return this.updateAvailable
  }

  onUpdateAvailable(callback: () => void): void {
    this.onUpdateAvailableCallback = callback
  }
}