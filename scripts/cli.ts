#!/usr/bin/env node
import { createServer } from 'vite'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import {
  buildComponentPackage,
  packageComponentZip,
  testComponentPipeline,
  validatePackageArtifact,
  type ComponentConfig
} from '@randee/studio-kit'

function getArg(index: number): string {
  return process.argv[index] ?? ''
}

function usage(): void {
  process.stdout.write([
    'Randee Studio CLI',
    '',
    'Commands:',
    '  npm run studio slider',
    '  npm run build:component slider',
    '  npm run package:component slider',
    '  npm run validate:package [path]',
    '  npm run test:component slider',
    ''
  ].join('\n'))
}

async function runStudio(componentCode: string): Promise<void> {
  const repoRoot = resolve(process.cwd())
  const studioRoot = resolve(repoRoot, 'apps/studio')

  if (!existsSync(studioRoot)) {
    throw new Error('Studio app is missing. Run scaffold first.')
  }

  process.env.VITE_STUDIO_COMPONENT = componentCode || 'slider'

  const server = await createServer({
    root: studioRoot,
    configFile: resolve(studioRoot, 'vite.config.ts'),
    server: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true
    }
  })

  await server.listen()
  server.printUrls()
}

async function runBuild(componentCode: string): Promise<void> {
  const result = await buildComponentPackage(componentCode)
  process.stdout.write(`${result.message}\n`)
}

async function runPackage(componentCode: string): Promise<void> {
  const result = await packageComponentZip(componentCode)
  process.stdout.write(`${result.message}\n`)
  process.stdout.write(`${result.zipPath}\n`)
}

async function runValidate(target: string): Promise<void> {
  const result = await validatePackageArtifact(target || undefined)
  const prefix = result.success ? 'OK' : 'FAIL'
  process.stdout.write(`${prefix}: ${result.message}\n`)
  if (result.issues.length > 0) {
    for (const issue of result.issues) {
      process.stdout.write(`- [${issue.severity}] ${issue.message}\n`)
    }
  }
}

async function runTest(componentCode: string): Promise<void> {
  const result = await testComponentPipeline(componentCode)
  process.stdout.write(`${result.message}\n`)
  for (const line of result.report) {
    process.stdout.write(`${line}\n`)
  }
  if (!result.success) {
    process.exitCode = 1
  }
}

async function main(): Promise<void> {
  const command = getArg(2)
  const value = getArg(3)

  if (!command || command === '--help' || command === '-h') {
    usage()
    return
  }

  if (command === 'studio') {
    await runStudio(value || 'slider')
    return
  }

  if (command === 'build:component') {
    if (!value) throw new Error('build:component requires a component code')
    await runBuild(value)
    return
  }

  if (command === 'package:component') {
    if (!value) throw new Error('package:component requires a component code')
    await runPackage(value)
    return
  }

  if (command === 'validate:package') {
    await runValidate(value)
    return
  }

  if (command === 'test:component') {
    if (!value) throw new Error('test:component requires a component code')
    await runTest(value)
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})

