#!/usr/bin/env node
// Suite E2E di smoke test per Gestione Appalti.
// Uso: node e2e/run.mjs  [--grep <testo>]  (vedi e2e/README.md)
// Usa la libreria `playwright` direttamente (nessun test runner aggiuntivo).

import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tests } from './tests.mjs'

const require = createRequire(import.meta.url) // risolve anche installazioni globali (NODE_PATH)
const { chromium } = require('playwright')

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const BASE_PATH = '/GestioneAppalti/'
const args = process.argv.slice(2)
const grep = args.includes('--grep') ? args[args.indexOf('--grep') + 1] : process.env.E2E_GREP
const headed = args.includes('--headed')
const ARTIFACTS = process.env.E2E_ARTIFACTS || join(ROOT, 'e2e', 'artifacts')

// Server statico minimo per dist/ se E2E_BASE_URL non è impostata.
async function startStaticServer() {
  const dist = join(ROOT, 'dist')
  if (!existsSync(join(dist, 'index.html'))) throw new Error('dist/ non trovata: eseguire prima la build (vedi e2e/README.md) oppure impostare E2E_BASE_URL.')
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' }
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (!p.startsWith(BASE_PATH)) { res.writeHead(302, { location: BASE_PATH }); return res.end() }
    p = normalize(p.slice(BASE_PATH.length)).replace(/^(\.\.[/\\])+/, '')
    let file = join(dist, p)
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html')
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  return { server, url: `http://127.0.0.1:${server.address().port}${BASE_PATH}` }
}

// Errori di console attesi e non bloccanti (documentati in e2e/README.md).
const ALLOWED_CONSOLE = [
  /Verifica utente Auth fallita: AuthSessionMissingError/, // App.tsx: getUser() senza sessione, schermata di login
  /Failed to load resource: the server responded with a status of 4\d\d/, // risposte d'errore simulate (credenziali errate, codice MFA errato)
]

class AssertionError extends Error {}
export function expect(cond, msg) { if (!cond) throw new AssertionError(msg) }

async function main() {
  let base = process.env.E2E_BASE_URL
  let srv
  if (!base) { srv = await startStaticServer(); base = srv.url }
  if (!base.endsWith('/')) base += '/'
  mkdirSync(ARTIFACTS, { recursive: true })
  const browser = await chromium.launch({ headless: !headed })
  const selected = tests.filter((t) => !grep || t.name.toLowerCase().includes(grep.toLowerCase()))
  const results = []
  console.log(`E2E Gestione Appalti — ${selected.length} test su ${base}\n`)
  for (const t of selected) {
    const context = await browser.newContext({ viewport: t.viewport || { width: 1366, height: 900 }, locale: 'it-IT', timezoneId: 'Europe/Rome' })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    const pageErrors = [], consoleErrors = []
    page.on('pageerror', (e) => pageErrors.push(String(e && e.stack || e)))
    page.on('console', (m) => { if (m.type() === 'error' && !ALLOWED_CONSOLE.some((r) => r.test(m.text()))) consoleErrors.push(m.text()) })
    page.on('dialog', (d) => d.dismiss().catch(() => {}))
    const started = Date.now()
    let error = null
    const ctx = { page, base, expect, consoleErrors, pageErrors, notes: [] }
    try {
      await t.run(ctx)
      await page.waitForTimeout(300)
      if (pageErrors.length) throw new AssertionError('Errori JS non gestiti (pageerror):\n  ' + pageErrors.join('\n  '))
      if (consoleErrors.length && !t.allowConsoleErrors) throw new AssertionError('Errori in console:\n  ' + [...new Set(consoleErrors)].join('\n  '))
    } catch (e) {
      error = e
      const shot = join(ARTIFACTS, t.name.replace(/[^a-z0-9]+/gi, '_') + '.png')
      await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
      if (pageErrors.length && !String(e.message).includes('pageerror')) e.message += '\n  pageerror: ' + pageErrors.join(' | ')
    }
    const ms = Date.now() - started
    results.push({ name: t.name, ok: !error, ms, error, notes: ctx.notes })
    console.log(`${error ? '✗ FALLITO' : '✓ OK     '} ${t.name} (${ms} ms)`)
    if (error) console.log('    ' + String(error.message).split('\n').join('\n    '))
    for (const n of ctx.notes) console.log('    nota: ' + n)
    await context.close()
  }
  await browser.close()
  srv?.server.close()
  const failed = results.filter((r) => !r.ok)
  console.log(`\nRisultato: ${results.length - failed.length} superati, ${failed.length} falliti su ${results.length}.`)
  if (failed.length) console.log('Screenshot dei fallimenti in ' + ARTIFACTS)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(2) })
