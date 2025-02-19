import chalk from 'chalk'
import logUpdate from 'log-update'

import {DIRECTUS_PINK} from '../constants'

export const RANDOM_SAYINGS = [
  'One does not simply write backends...',
  'I don\'t always test my code, but when I do, I use production.',
  'A wild Directus appears!',
  'Error 418: I\'m a teapot. Just kidding, I\'m Directus and I\'ve got your backend covered.',
  'I\'ll fix it later. Narrator: They didn\'t fix it later.',
]

export async function animatedBunny(customMessage?: string) {
  const saying = customMessage || RANDOM_SAYINGS[Math.floor(Math.random() * RANDOM_SAYINGS.length)]
  let typedSaying = ''
  let blinkState = true
  let charIndex = 0
  let isCleanedUp = false

  const cleanup = () => {
    if (isCleanedUp) return
    isCleanedUp = true
    clearInterval(animation)
    clearInterval(typing)
    logUpdate.done()
  }

  // Ensure cleanup on process exit
  process.on('exit', cleanup)
  process.on('SIGINT', () => {
    cleanup()
    process.exit(0)
  })

  const updateFrame = () => {
    if (isCleanedUp) return
    const eyes = blinkState ? '• •' : '- -'
    const frame = `
(\\(\\
( ${eyes}) ${chalk.dim('.')}${chalk.hex(DIRECTUS_PINK).visible(`"${typedSaying}"`)}
o_(")(")
`
    logUpdate(frame)
  }

  const animation = setInterval(() => {
    blinkState = !blinkState
    updateFrame()
  }, 500)

  const typing = setInterval(() => {
    if (charIndex < saying.length) {
      typedSaying += saying[charIndex]
      charIndex++
      updateFrame()
    } else {
      clearInterval(typing)
    }
  }, 10)

  try {
    // Run the animation for the duration of typing plus 1 second
    await new Promise(resolve => setTimeout(resolve, saying.length * 10 + 1000))
  } finally {
    cleanup()
    // Remove the event listeners
    process.removeListener('exit', cleanup)
    process.removeListener('SIGINT', cleanup)
  }
}
