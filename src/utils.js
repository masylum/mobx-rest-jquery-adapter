// @flow
import { forEach, isNull, isArray } from 'lodash'

function arrayHasFile (arr: Array<any>) {
  return !!arr.find(val => val instanceof File)
}

export function buildFormData (data: ?{ [key: string]: mixed }) {
  const formData = new FormData()
  let hasFile = false

  forEach(data, (val: any, attr: string) => {
    hasFile = hasFile || val instanceof File

    if (isArray(val)) {
      hasFile = hasFile || arrayHasFile(val)
      return formData.append(`${attr}[]`, val)
    }

    if (!isNull(val)) formData.append(attr, val)
  })

  return { hasFile, formData }
}
