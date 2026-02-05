declare global {
  interface URLPatternInit {
    baseURL?: string
    username?: string
    password?: string
    protocol?: string
    hostname?: string
    port?: string
    pathname?: string
    search?: string
    hash?: string
  }

  interface URLPatternComponentResult {
    input: string
    groups: Record<string, string>
  }

  interface URLPatternResult {
    inputs: (string | URLPatternInit)[]
    protocol: URLPatternComponentResult
    username: URLPatternComponentResult
    password: URLPatternComponentResult
    hostname: URLPatternComponentResult
    port: URLPatternComponentResult
    pathname: URLPatternComponentResult
    search: URLPatternComponentResult
    hash: URLPatternComponentResult
  }

  class URLPattern {
    constructor(input: string, baseURL?: string)
    constructor(init?: URLPatternInit, baseURL?: string)

    protocol: string
    username: string
    password: string
    hostname: string
    port: string
    pathname: string
    search: string
    hash: string

    test(input: string, baseURL?: string): boolean
    test(input: URLPatternInit, baseURL?: string): boolean
    exec(input: string, baseURL?: string): URLPatternResult | null
    exec(input: URLPatternInit, baseURL?: string): URLPatternResult | null
  }
}

export {}
