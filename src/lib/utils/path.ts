import fs from 'node:fs'
import path from 'node:path'
import {cwd} from 'node:process'

/**
 * Resolves a given path to an absolute path and checks if it exists.
 * @param inputPath The path to resolve.
 * @param checkExistence Whether to check if the resolved path exists.
 * @returns The resolved absolute path if it exists, or null if it doesn't.
 */
export default function resolvePathAndCheckExistence(inputPath: string, checkExistence: boolean = true): null | string {
  const resolvedPath = path.isAbsolute(inputPath) ? inputPath : path.resolve(cwd(), inputPath)

  if (!checkExistence || fs.existsSync(resolvedPath)) {
    return resolvedPath
  }

  return null
}
