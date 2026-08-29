import 'server-only'
import { google } from 'googleapis'

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!email || !key) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY must be set'
    )
  }

  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

export async function fetchRange(range: string): Promise<string[][]> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is not set')
  }

  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  return (response.data.values as string[][] | undefined) ?? []
}
