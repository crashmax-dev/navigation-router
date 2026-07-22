import { MemoryAdapter } from 'navigation-router'
import { describe, expect, it, vi } from 'vitest'

describe('memory adapter', () => {
  it('starts at the initial path', () => {
    const adapter = new MemoryAdapter('/start')
    expect(adapter.getLocation()).toBe('/start')
  })

  it('pushes and replaces history entries', () => {
    const adapter = new MemoryAdapter('/')
    adapter.navigate('/a')
    adapter.navigate('/b')
    expect(adapter.getLocation()).toBe('/b')

    adapter.navigate('/c', true)
    expect(adapter.getLocation()).toBe('/c')

    adapter.go(-1)
    expect(adapter.getLocation()).toBe('/a')
  })

  it('notifies listeners and supports unsubscribe', () => {
    const adapter = new MemoryAdapter('/')
    const listener = vi.fn()
    const unlisten = adapter.listen(listener)

    adapter.navigate('/x')
    expect(listener).toHaveBeenCalledWith('/x')

    unlisten()
    adapter.navigate('/y')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('createHref returns the path as-is', () => {
    const adapter = new MemoryAdapter()
    expect(adapter.createHref('/posts')).toBe('/posts')
  })
})
