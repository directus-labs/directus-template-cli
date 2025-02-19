import {existsSync, mkdirSync} from 'node:fs'

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true})
  }
}

export function ensureDirSync(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true})
  }
}
