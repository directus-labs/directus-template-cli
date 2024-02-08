/* eslint-disable unicorn/no-array-reduce  */
/* eslint-disable perfectionist/sort-objects */
import {schemaApply, schemaDiff} from '@directus/sdk'
import {ux} from '@oclif/core'
import * as inquirer from 'inquirer'
import path from 'node:path'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadSchema(dir: string) {
  let diff

  try {
    const schemaDir = path.resolve(
      dir,
      'schema',
    )

    const schema = readFile('snapshot', schemaDir)

    // @ts-ignore
    diff = await api.client.request(schemaDiff(schema, true))

    if (!diff) {
      ux.log('No schema to apply')
      return
    }

    const diffKeys = ['collections', 'fields', 'relations']

    const changes = diffKeys.map(table => {
      const tableDiff = diff.diff[table]

      if (!tableDiff) {
        return
      }

      const tableChanges = tableDiff.reduce((acc, item) => {
        const {kind} = item.diff[0]
        acc[DiffKind[kind]] = acc[DiffKind[kind]] ? acc[DiffKind[kind]] + 1 : 1
        return acc
      }, {})

      return {
        table,
        ...tableChanges,
      }
    })

    // Display the changes to be applied in a table using the ux.table method. The table should have the following columns: Table, New, Edit, Delete
    ux.log('Schema diff summary from current instance:')
    ux.table(changes, {
      table: {
        get: (row: any) => row.table,
        minWidth: 20,
      },
      create: {
        get: (row: any) => row.new || 0,
        minWidth: 5,

      },
      update: {
        get: (row: any) => row.edit || 0,
        minWidth: 5,
      },
      delete: {
        get: (row: any) => row.delete || 0,
        minWidth: 5,
      },

    })
  } catch (error) {
    logError(error)
  }

  const proceed = await inquirer.prompt([{
    message: 'Applying . This cannot be undone. Continue?',
    name: 'continue',
    type: 'confirm',

  }])

  if (!proceed.continue) {
    ux.log('Cancelled applying schema changes and exiting...')
    ux.exit(0)
  }

  try {
    await api.client.request(schemaApply(diff))

    ux.log('Loaded schema')
  } catch (error) {
    logError(error)
  }
}

/**
 * Indicates the kind of change based on comparisons by deep-diff package
 */
export const DiffKind = {
  /** indicates a change occurred within an array */
  A: 'array',
  /** indicates a property/element was deleted */
  D: 'delete',
  /** indicates a property/element was edited */
  E: 'edit',
  /** indicates a newly added property/element */
  N: 'new',
}
