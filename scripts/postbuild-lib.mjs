import { readFileSync, writeFileSync } from 'node:fs'

const path = 'dist/index.d.ts'
const reference = '/// <reference path="./url-pattern.d.ts" />\n'
const source = readFileSync(path, 'utf8')

if (!source.includes('url-pattern.d.ts')) {
  writeFileSync(path, reference + source)
}
