import fs from 'node:fs'

export default function readFile(file: string, dir:string): any[] {
  const f = fs.readFileSync(`${dir}/${file}.json`, 'utf8')
  const obj = JSON.parse(f)
  return obj
}

export function readJsonFile(path: string): any[] {
  const f = fs.readFileSync(`${path}.json`, 'utf8')
  const obj = JSON.parse(f)
  return obj
}
