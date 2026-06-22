/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs")

const originalReadlink = fs.readlink
const originalReadlinkSync = fs.readlinkSync
const originalReadlinkPromise = fs.promises.readlink

function normalizeReadlinkError(error) {
  if (error && error.code === "EISDIR" && error.syscall === "readlink") {
    error.code = "EINVAL"
  }

  return error
}

fs.readlink = function patchedReadlink(...args) {
  const callback = args[args.length - 1]

  if (typeof callback !== "function") {
    return originalReadlink.apply(this, args)
  }

  args[args.length - 1] = (error, linkString) => {
    callback(normalizeReadlinkError(error), linkString)
  }

  return originalReadlink.apply(this, args)
}

fs.readlinkSync = function patchedReadlinkSync(...args) {
  try {
    return originalReadlinkSync.apply(this, args)
  } catch (error) {
    throw normalizeReadlinkError(error)
  }
}

fs.promises.readlink = async function patchedReadlinkPromise(...args) {
  try {
    return await originalReadlinkPromise.apply(this, args)
  } catch (error) {
    throw normalizeReadlinkError(error)
  }
}
