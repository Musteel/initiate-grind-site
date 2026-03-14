'use client'

export function FooterCopyright() {
  const year = new Date().getFullYear()

  return (
    <>
      © {year} Deadlock Trainer · Community project · Not affiliated with Valve
    </>
  )
}
