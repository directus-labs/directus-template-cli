#!/usr/bin/env node
/* eslint-disable n/no-unpublished-bin */

import {execute} from '@oclif/core'

await execute({dir: import.meta.url})
