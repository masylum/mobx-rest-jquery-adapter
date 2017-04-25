// @flow
import jq from 'jquery'
import { forEach, isNull, merge } from 'lodash'

type Request = {
  abort: () => void;
  promise: Promise<*>;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Options = {
  method: Method;
  headers?: ?{ [key: string]: string };
  xhrFields: { [key: string]: mixed };
  onProgress?: (num: number) => mixed;
  data?: ?{ [key: string]: mixed };
}

function xhrWithProgress (options: {onProgress?: (value: number) => mixed}) {
  return () => {
    const myXhr = jq.ajaxSettings.xhr()

    if (myXhr.upload && options.onProgress) {
      myXhr.upload.addEventListener('progress', (prog) => {
        const progress = Math.ceil((prog.loaded / prog.total) * 100)
        options.onProgress && options.onProgress(progress || 100)
        // ^ This is just for flow
      }, false)
    }

    return myXhr
  }
}

function ajaxOptions (options: Options): ?{} {
  if (options.method === 'GET') {
    return {
      data: options.data,
      headers: options.headers,
      xhrFields: options.xhrFields
    }
  }

  const formData = new FormData()
  let hasFile = false

  forEach(options.data, (val: any, attr: string) => {
    hasFile = hasFile || val instanceof File
    if (!isNull(val)) formData.append(attr, val)
  })

  const baseOptions = {
    method: options.method
  }

  if (hasFile) {
    return Object.assign({}, baseOptions, {
      cache: false,
      processData: false,
      data: formData,
      xhrFields: options.xhrFields,
      headers: options.headers,
      xhr: xhrWithProgress(options),
      contentType: false
    })
  }

  return Object.assign({}, baseOptions, {
    contentType: 'application/json',
    headers: options.headers,
    xhrFields: options.xhrFields,
    data: options.data ? JSON.stringify(options.data) : null
  })
}

function parseJson (str: string): ?{[key: string]: mixed} {
  try {
    return JSON.parse(str)
  } catch (_error) {
    return null
  }
}

function ajax (url: string, options: Options): Request {
  const xhr = jq.ajax(url, ajaxOptions(options))

  const promise = new Promise((resolve, reject) => {
    xhr
      .done(resolve)
      .fail((jqXHR, _textStatus) => {
        const json = parseJson(jqXHR.responseText)
        const ret = json ? json.errors : {}

        return reject(ret || {})
      })
  })

  const abort = () => xhr.abort()

  return { abort, promise }
}

export default {
  apiPath: '',
  commonOptions: {},

  get (path: string, data: ?{}, options?: {} = {}): Request {
    return ajax(
      `${this.apiPath}${path}`,
      merge({}, { method: 'GET', data }, this.commonOptions, options)
    )
  },

  post (path: string, data: ?{}, options?: {} = {}): Request {
    return ajax(
      `${this.apiPath}${path}`,
      merge({}, { method: 'POST', data }, this.commonOptions, options)
    )
  },

  put (path: string, data: ?{}, options?: {} = {}): Request {
    return ajax(
      `${this.apiPath}${path}`,
      merge({}, { method: 'PUT', data }, this.commonOptions, options)
    )
  },

  del (path: string, options?: {} = {}): Request {
    return ajax(
      `${this.apiPath}${path}`,
      merge({}, { method: 'DELETE' }, this.commonOptions, options)
    )
  }
}
