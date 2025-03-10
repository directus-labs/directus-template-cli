import {Hook} from '@oclif/core'

import {PostHogService} from '../../services/posthog'

const hook: Hook.Init = async function (opts) {
  // Only track if we have a command
  if (opts.id) {
    PostHogService.getInstance().trackCommandStart(opts.id)
  }
}

export default hook
