import {exec} from 'node:child_process'

export default function openUrl(url: string): void {
  switch (process.platform) {
  case 'darwin': {
    exec(`open ${url}`)
    break
  }

  case 'win32': {
    exec(`start ${url}`)
    break
  }

  default: {
    exec(`xdg-open ${url}`)
  }
  }
}
