import type { RouterAdapter } from './router-adapter'

export class MemoryAdapter implements RouterAdapter {
  private history: string[] = ['/']
  private index: number = 0
  private listeners: ((path: string) => void)[] = []

  constructor(initialPath = '/') {
    this.history = [initialPath]
  }

  getLocation() {
    return this.history[this.index]
  }

  listen(callback: (path: string) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  navigate(path: string, replace?: boolean) {
    if (replace) {
      this.history[this.index] = path
    } else {
      this.history = this.history.slice(0, this.index + 1)
      this.history.push(path)
      this.index++
    }
    this.notify()
  }

  go(delta: number) {
    const newIndex = this.index + delta
    if (newIndex >= 0 && newIndex < this.history.length) {
      this.index = newIndex
      this.notify()
    }
  }

  private notify() {
    const path = this.getLocation()
    this.listeners.forEach(cb => cb(path))
  }

  createHref(path: string) {
    return path
  }
}
