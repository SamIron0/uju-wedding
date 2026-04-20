import { NextResponse } from "next/server";
import { Resend } from "resend";
import { google } from "googleapis";

type RsvpPayload = {
  fullName?: string;
  phone?: string;
  email?: string;
  attending?: boolean;
};

// ── Module-level singletons ──────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

let _sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getSheetsClient() {
  if (_sheetsClient) return _sheetsClient;
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  _sheetsClient = google.sheets({ version: "v4", auth });
  return _sheetsClient;
}

// ── Single batchGet for both sheets ─────────────────────────────────────────
async function batchReadSheets(): Promise<{
  sheet1Rows: string[][];
  sheet2Rows: string[][];
}> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    ranges: ["Sheet1!A:F", "Sheet2!A:B"],
  });

  const [sheet1Data, sheet2Data] = res.data.valueRanges ?? [];
  const sheet1All = (sheet1Data?.values ?? []) as string[][];
  const sheet2All = (sheet2Data?.values ?? []) as string[][];

  return {
    sheet1Rows: sheet1All.slice(1),
    sheet2Rows: sheet2All,
  };
}

// ── Claim invite code from already-fetched Sheet2 rows ───────────────────────
async function claimInviteCodeFromRows(sheet2Rows: string[][]): Promise<number> {
  let claimedCode: number | null = null;
  let claimedSheetRow: number | null = null;

  for (let i = 1; i < sheet2Rows.length; i++) {
    const [code, used] = sheet2Rows[i];
    if (used === "FALSE") {
      claimedCode = Number(code);
      claimedSheetRow = i + 1;
      break;
    }
  }

  if (claimedCode === null || claimedSheetRow === null || Number.isNaN(claimedCode)) {
    throw new Error("No unused invite cards remain in Sheet2.");
  }

  await getSheetsClient().spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Sheet2!B${claimedSheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [["TRUE"]] },
  });

  return claimedCode;
}

// ── Public blob URL — no auth required ──────────────────────────────────────
function getInviteBlobUrl(code: number): string {
  return `https://arnhmw1aq5cozuh4.public.blob.vercel-storage.com/Card%20${code}.pdf`;
}

function buildGuestEmailHtml(fullName: string, attending: boolean): string {
  if (!attending) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Thank You — Uju &amp; Chinedu</title></head>
<body style="margin:0;padding:0;background:#f5f3f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f4;padding:24px 0;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e3d4d6;">
<tr>
  <td align="center" style="background:#722F37;padding:28px 20px 22px;">
    <p style="margin:0;font-family:'Great Vibes','Times New Roman',serif;font-size:28px;color:#fff;">Uju &amp; Chinedu</p>
    <p style="margin:10px 0 0;font-family:'Cormorant Garamond','Times New Roman',serif;font-size:16px;color:#fbeff0;font-style:italic;">Saturday, May 16, 2026 &middot; Ikorodu, Lagos</p>
  </td>
</tr>
<tr>
  <td style="padding:28px 24px 24px;">
    <p style="margin:0 0 14px;font-size:15px;color:#1a0a0c;">Dear ${fullName},</p>
    <p style="margin:0 0 14px;font-size:14px;color:#3d2c30;line-height:1.7;">Thank you so much for letting us know — we truly appreciate you taking the time to respond.</p>
    <p style="margin:0 0 14px;font-size:14px;color:#3d2c30;line-height:1.7;">We're sorry you won't be able to make it in person, but please know that you'll be with us in spirit as we celebrate this beautiful new chapter.</p>
    <p style="margin:0 0 6px;font-size:14px;color:#3d2c30;line-height:1.7;">With so much love and gratitude,</p>
    <p style="margin:0;font-size:13px;color:#722F37;font-style:italic;">Uju &amp; Chinedu</p>
    <p style="margin:8px 0 0;font-size:11px;color:#7f5f65;letter-spacing:0.18em;text-transform:uppercase;">#TheCUStory'26</p>
  </td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>You're Invited — Uju &amp; Chinedu</title></head>
<body style="margin:0;padding:0;background:#f5f3f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f4;padding:24px 0;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e3d4d6;">
<tr>
  <td align="center" style="background:#722F37;padding:32px 20px 26px;">
    <p style="margin:0;font-family:'Great Vibes','Times New Roman',serif;font-size:30px;color:#fff;">Uju &amp; Chinedu</p>
    <p style="margin:10px 0 0;font-family:'Cormorant Garamond','Times New Roman',serif;font-size:17px;color:#fbeff0;font-style:italic;">You're officially on the list 🎉</p>
  </td>
</tr>
<tr>
  <td style="padding:28px 24px 8px;">
    <p style="margin:0 0 14px;font-size:15px;color:#1a0a0c;">Dear ${fullName},</p>
    <p style="margin:0 0 14px;font-size:14px;color:#3d2c30;line-height:1.7;">We're so excited to have you celebrate with us in person! Your RSVP has been received and your spot is confirmed.</p>
    <p style="margin:0 0 14px;font-size:14px;color:#3d2c30;line-height:1.7;">Your personal wedding invitation is attached to this email as a PDF. Please download and keep it safe — you'll need to present it at the venue for entry.</p>
  </td>
</tr>
<tr>
  <td style="padding:0 24px 28px;">
    <p style="margin:0 0 4px;font-size:13px;color:#3d2c30;line-height:1.6;">We can't wait to celebrate with you.</p>
    <p style="margin:0 0 6px;font-size:13px;color:#3d2c30;">With Love, Uju &amp; Chinedu</p>
    <p style="margin:0;font-size:11px;color:#7f5f65;letter-spacing:0.18em;text-transform:uppercase;">#TheCUStory'26</p>
  </td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildOrganiserEmailHtml(payload: {
  fullName: string;
  phone: string;
  email: string;
  attending: boolean;
  timestamp: string;
  inviteCode: string;
}): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <title>New RSVP — ${payload.fullName}</title>
    </head>
    <body style="margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background-color:#f7f5f6;">
      <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:10px;border:1px solid #e0d4d7;">
        <tr>
          <td style="padding:16px 18px 4px 18px;">
            <h1 style="margin:0 0 6px 0;font-size:17px;color:#1a0a0c;">New RSVP Received</h1>
            <p style="margin:0;font-size:12px;color:#7a5d64;">Wedding of Uju &amp; Chinedu — #TheCUStory'26</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 18px 18px 18px;">
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="font-size:13px;color:#2d1f23;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 4px;font-weight:600;width:130px;">Full Name</td>
                <td style="padding:6px 4px;">${payload.fullName}</td>
              </tr>
              <tr>
                <td style="padding:6px 4px;font-weight:600;">Phone</td>
                <td style="padding:6px 4px;">${payload.phone}</td>
              </tr>
              <tr>
                <td style="padding:6px 4px;font-weight:600;">Email</td>
                <td style="padding:6px 4px;">${payload.email}</td>
              </tr>
              <tr>
                <td style="padding:6px 4px;font-weight:600;">Attending</td>
                <td style="padding:6px 4px;">${payload.attending ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td style="padding:6px 4px;font-weight:600;">Invite Code</td>
                <td style="padding:6px 4px;">${payload.inviteCode}</td>
              </tr>
              <tr>
                <td style="padding:6px 4px;font-weight:600;">Received At</td>
                <td style="padding:6px 4px;">${payload.timestamp}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RsvpPayload;
    const fullName = (body.fullName ?? "").trim();
    const phone = (body.phone ?? "").trim();
    const email = (body.email ?? "").trim();
    const attending = Boolean(body.attending);

    if (!fullName || !phone || !email) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const missingEnvVars = [
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_PRIVATE_KEY",
      "GOOGLE_SHEET_ID",
      "RESEND_API_KEY",
      "RESEND_FROM_EMAIL",
      "ORGANISER_EMAIL",
    ].filter((key) => !process.env[key]);

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

    // ── 1. Single batchGet — Sheet1 + Sheet2 in one round-trip ──────────────
    const { sheet1Rows, sheet2Rows } = await batchReadSheets();

    // ── 2. Duplicate check ───────────────────────────────────────────────────
    const emailExists = sheet1Rows.some(
      (row) => row[3]?.toLowerCase().trim() === email.toLowerCase()
    );
    const phoneExists = sheet1Rows.some(
      (row) => row[2]?.trim() === phone
    );

    if (emailExists) {
      return NextResponse.json(
        { error: "This email address has already been used to RSVP." },
        { status: 409 }
      );
    }
    if (phoneExists) {
      return NextResponse.json(
        { error: "This phone number has already been used to RSVP." },
        { status: 409 }
      );
    }

    const timestamp = new Date().toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      dateStyle: "medium",
      timeStyle: "short",
    });

    // ── 3. Attending path: claim code → sheet append + emails concurrently ───
    let claimedCode: number | null = null;

    if (attending) {
      // Must be sequential — atomic claim before anything else
      claimedCode = await claimInviteCodeFromRows(sheet2Rows);

      // Sheet append and both emails all fire concurrently —
      // PDF is now a URL reference, no buffer fetch needed
      await Promise.all([
        getSheetsClient().spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: "Sheet1!A:F",
          valueInputOption: "RAW",
          requestBody: {
            values: [[timestamp, fullName, phone, email, "Yes", String(claimedCode)]],
          },
        }),
        resend.emails.send({
          from: `CUStory <${process.env.RESEND_FROM_EMAIL!}>`,
          to: email,
          subject: "You're Invited — Uju & Chinedu Wedding 🎉",
          html: buildGuestEmailHtml(fullName, true),
          attachments: [
            {
              filename: `CU-Wedding-Invite-${claimedCode}.pdf`,
              path: getInviteBlobUrl(claimedCode),
            },
          ],
        }),
        resend.emails.send({
          from: `CUStory <${process.env.RESEND_FROM_EMAIL!}>`,
          to: process.env.ORGANISER_EMAIL!,
          subject: `New RSVP — ${fullName}`,
          html: buildOrganiserEmailHtml({
            fullName,
            phone,
            email,
            attending: true,
            timestamp,
            inviteCode: String(claimedCode),
          }),
        }),
      ]);
    } else {
      // Non-attending: sheet append and both emails concurrently, no PDF
      await Promise.all([
        getSheetsClient().spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: "Sheet1!A:F",
          valueInputOption: "RAW",
          requestBody: {
            values: [[timestamp, fullName, phone, email, "No", "N/A"]],
          },
        }),
        resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: email,
          subject: "Thank You for Your RSVP — Uju & Chinedu",
          html: buildGuestEmailHtml(fullName, false),
        }),
        resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: process.env.ORGANISER_EMAIL!,
          subject: `New RSVP — ${fullName}`,
          html: buildOrganiserEmailHtml({
            fullName,
            phone,
            email,
            attending: false,
            timestamp,
            inviteCode: "N/A",
          }),
        }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Unable to process RSVP at this time." },
      { status: 500 }
    );
  }
}