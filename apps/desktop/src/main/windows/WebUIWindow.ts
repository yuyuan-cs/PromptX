import { BrowserWindow } from 'electron'
import * as path from 'node:path'
import * as logger from '@promptx/logger'

export class WebUIWindow {
  private window: BrowserWindow | null = null

  constructor() {}

  create(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.focus()
      return
    }

    this.window = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1024,
      minHeight: 768,
      title: 'PromptX',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
      show: false,
    })

    this.window.once('ready-to-show', () => {
      this.window?.show()
    })

    this.window.on('closed', () => {
      this.window = null
    })

    if (process.env.NODE_ENV === 'development') {
      this.window.loadURL('http://localhost:3000')
      this.window.webContents.openDevTools()
    } else {
      const webUIPath = path.join(process.resourcesPath, 'web', 'index.html')
      this.window.loadFile(webUIPath).catch((error) => {
        logger.error('Failed to load web UI:', error)
      })
    }

    logger.info('Web UI window created')
  }

  show(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show()
      this.window.focus()
    } else {
      this.create()
    }
  }

  hide(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide()
    }
  }

  destroy(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy()
      this.window = null
    }
  }

  isVisible(): boolean {
    return this.window !== null && !this.window.isDestroyed() && this.window.isVisible()
  }
}