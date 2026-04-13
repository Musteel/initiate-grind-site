'use client'

export function FooterCopyright() {
  const year = new Date().getFullYear()

  return (
    <>
      © {year} Initiate Grind · Community project · Vibecode Slop · Not affiliated with Valve
    </>
  )
}