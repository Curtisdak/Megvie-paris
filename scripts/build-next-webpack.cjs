/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path")

const patchPath = path
  .join(__dirname, "patch-readlink-eisdir.cjs")
  .replace(/\\/g, "/")
const existingNodeOptions = process.env.NODE_OPTIONS?.trim()

process.env.NODE_OPTIONS = [
  existingNodeOptions,
  `--require ${patchPath}`,
]
  .filter(Boolean)
  .join(" ")

require(patchPath)

process.argv = [
  process.argv[0],
  require.resolve("next/dist/bin/next"),
  "build",
  "--webpack",
]

require("next/dist/bin/next")
