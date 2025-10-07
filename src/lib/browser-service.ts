import { chromium, Browser, Page } from 'playwright'

export interface BrowserResult {
  content: string
  title: string
  url: string
  screenshot?: string
  metadata?: {
    loadTime: number
    statusCode: number
  }
}

class BrowserService {
  private browser: Browser | null = null

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
    return this.browser
  }

  async navigateAndExtract(url: string, options?: {
    screenshot?: boolean
    waitForSelector?: string
    timeout?: number
  }): Promise<BrowserResult> {
    const browser = await this.initialize()
    const page = await browser.newPage()
    const startTime = Date.now()

    try {
      // Navigate to the page
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: options?.timeout || 30000
      })

      // Wait for specific selector if provided
      if (options?.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: 5000
        }).catch(() => {
          console.log(`Selector ${options.waitForSelector} not found, continuing anyway`)
        })
      }

      // Get page metadata
      const title = await page.title()
      const content = await page.content()

      // Take screenshot if requested
      let screenshot: string | undefined
      if (options?.screenshot) {
        const buffer = await page.screenshot({
          fullPage: false,
          type: 'png'
        })
        screenshot = buffer.toString('base64')
      }

      const loadTime = Date.now() - startTime

      return {
        content,
        title,
        url: page.url(),
        screenshot,
        metadata: {
          loadTime,
          statusCode: response?.status() || 0
        }
      }
    } finally {
      await page.close()
    }
  }

  async extractStructuredData(url: string, selectors: {
    [key: string]: string
  }): Promise<{ [key: string]: string | string[] }> {
    const browser = await this.initialize()
    const page = await browser.newPage()

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })

      const data: { [key: string]: string | string[] } = {}

      for (const [key, selector] of Object.entries(selectors)) {
        try {
          // Check if selector wants multiple elements
          if (selector.includes('[]')) {
            const cleanSelector = selector.replace('[]', '')
            const elements = await page.locator(cleanSelector).all()
            data[key] = await Promise.all(
              elements.map(el => el.textContent().then(text => text?.trim() || ''))
            )
          } else {
            const element = page.locator(selector).first()
            const text = await element.textContent().catch(() => '')
            data[key] = text?.trim() || ''
          }
        } catch (error) {
          console.error(`Failed to extract ${key}:`, error)
          data[key] = ''
        }
      }

      return data
    } finally {
      await page.close()
    }
  }

  async searchAndExtract(query: string, options?: {
    maxResults?: number
    extractionSelectors?: { [key: string]: string }
  }): Promise<any[]> {
    const browser = await this.initialize()
    const page = await browser.newPage()

    try {
      // Use DuckDuckGo for privacy-friendly search
      await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
        waitUntil: 'domcontentloaded'
      })

      // Wait for results
      await page.waitForSelector('.results--main', { timeout: 5000 }).catch(() => {})

      // Extract search results
      const results = await page.locator('.result__a').all()
      const maxResults = Math.min(results.length, options?.maxResults || 10)

      const extractedResults = []

      for (let i = 0; i < maxResults; i++) {
        const result = results[i]
        const title = await result.textContent()
        const url = await result.getAttribute('href')

        if (title && url) {
          extractedResults.push({
            title: title.trim(),
            url
          })
        }
      }

      return extractedResults
    } finally {
      await page.close()
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

// Singleton instance
let browserService: BrowserService | null = null

export function getBrowserService(): BrowserService {
  if (!browserService) {
    browserService = new BrowserService()
  }
  return browserService
}

export async function closeBrowserService() {
  if (browserService) {
    await browserService.close()
    browserService = null
  }
}
