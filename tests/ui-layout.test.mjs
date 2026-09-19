import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import test from "node:test"
import ts from "typescript"

const read = (file) => readFileSync(file, "utf8")
function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory()
      ? sourceFiles(file)
      : file.endsWith(".tsx")
        ? [file]
        : []
  })
}

test("responsive grid tracks use spaces instead of top-level commas", () => {
  for (const file of [
    ...sourceFiles("src/app"),
    ...sourceFiles("src/components"),
  ]) {
    for (const [, tracks] of read(file).matchAll(/grid-cols-\[([^\]]+)\]/g)) {
      let depth = 0
      for (const char of tracks) {
        if (char === "(") depth++
        if (char === ")") depth--
        assert.ok(char !== "," || depth > 0, file + ": " + tracks)
      }
    }
  }
})

test("home does not delay content or force an installation modal", () => {
  assert.doesNotMatch(
    read("src/components/landing/home-page-client.tsx"),
    /WelcomeOverlay|showWelcome/,
  )
  assert.doesNotMatch(
    read("src/components/navigation/app-chrome.tsx"),
    /autoOpen|FloatingInstallButton/,
  )
  assert.match(
    read("src/components/navigation/app-header.tsx"),
    /InstallAppDialog iconOnly/,
  )
})

test("carousel supports motion preferences and manual pause controls", () => {
  const source = read("src/components/landing/event-image-slider-client.tsx")
  for (const contract of [
    "usePrefersReducedMotion",
    "!focused",
    "!hovered",
    "!reduceMotion",
    'document.visibilityState === "visible"',
    "onTouchEnd",
    "onKeyDown",
  ])
    assert.ok(source.includes(contract), contract)
  assert.match(source, /setPaused\(/)
})

test("anonymous donation details remain optional and checkout still uses the trusted API", () => {
  const source = read("src/components/donation/donate-page-client.tsx")
  assert.match(source, /createDonationSession\(/)
  const tree = ts.createSourceFile(
    "donate.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const inputs = []
  function visit(node) {
    if (
      ts.isJsxSelfClosingElement(node) &&
      node.tagName.getText(tree) === "Input"
    )
      inputs.push(node)
    ts.forEachChild(node, visit)
  }
  visit(tree)
  for (const field of ["donor-name", "donor-email"]) {
    const input = inputs.find((node) =>
      node.attributes.properties.some(
        (attribute) =>
          ts.isJsxAttribute(attribute) &&
          attribute.name.getText(tree) === "id" &&
          attribute.initializer &&
          ts.isStringLiteral(attribute.initializer) &&
          attribute.initializer.text === field,
      ),
    )
    assert.ok(input, field)
    assert.ok(
      !input.attributes.properties.some(
        (attribute) =>
          ts.isJsxAttribute(attribute) &&
          attribute.name.getText(tree) === "required",
      ),
    )
  }
})

test("page motion respects CSS reduced motion and keeps fixed admin navigation outside animated parents", () => {
  assert.match(read("src/app/globals.css"), /prefers-reduced-motion: reduce/)
  assert.match(
    read("src/components/navigation/page-transition.tsx"),
    /pathname.startsWith\("\/admin"\)/,
  )
  assert.doesNotMatch(
    read("src/components/admin/admin-route-transition.tsx"),
    /AnimatePresence/,
  )
})

test("recovery and loading states provide accessible feedback", () => {
  assert.match(read("src/app/error.tsx"), /onClick=\{reset\}/)
  assert.match(read("src/components/ui/page-skeleton.tsx"), /role="status"/)
  assert.match(read("src/components/ui/dialog.tsx"), />Fermer</)
})
