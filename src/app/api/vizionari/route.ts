import { NextResponse } from 'next/server'

const response = () => NextResponse.json(
  {
    error: 'Endpoint retras. Vizionarile sunt gestionate direct prin Supabase Auth si RLS.',
  },
  { status: 410 },
)

// This legacy D1 endpoint previously trusted user IDs supplied by the browser.
// Keeping a closed compatibility endpoint avoids accidental unauthenticated use
// while the UI talks to Supabase with the signed-in user's access token.
export const GET = response
export const POST = response
export const PATCH = response
export const DELETE = response
