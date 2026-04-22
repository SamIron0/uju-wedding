import { NextResponse } from "next/server";
import { Resend } from "resend";
import { google } from "googleapis";

type RsvpPayload = {
  fullName?: string;
  phone?: string;
  email?: string;
  category?: string;
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

const INVITE_IMAGE_URL =
  "https://thmmmaqcwcyesthh.public.blob.vercel-storage.com/invite.jpeg";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getSheet1Rows(): Promise<string[][]> {
  const res = await getSheetsClient().spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A:F",
  });
  const allRows = (res.data.values ?? []) as string[][];
  return allRows.slice(1);
}

function buildGuestEmailHtml(fullName: string, attending: boolean): string {
  if (!attending) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Thank You — Uju &amp; Chinedu</title></head>
<body style="margin:0;padding:0;background:#fbf6ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ef;padding:24px 0;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f0ddc0;">
<tr>
  <td align="center" style="background:#B5522B;padding:28px 20px 22px;">
    <p style="margin:0;font-family:'Great Vibes','Times New Roman',serif;font-size:28px;color:#fff;">Uju &amp; Chinedu</p>
    <p style="margin:10px 0 0;font-family:'Cormorant Garamond','Times New Roman',serif;font-size:16px;color:#f9e7bf;font-style:italic;">Saturday, May 16, 2026 &middot; Ikeja, Lagos</p>
  </td>
</tr>
<tr>
  <td style="padding:28px 24px 24px;">
    <p style="margin:0 0 14px;font-size:15px;color:#4a2816;">Dear ${fullName},</p>
    <p style="margin:0 0 14px;font-size:14px;color:#694332;line-height:1.7;">Thank you so much for letting us know — we truly appreciate you taking the time to respond.</p>
    <p style="margin:0 0 14px;font-size:14px;color:#694332;line-height:1.7;">We're sorry you won't be able to make it in person, but please know that you'll be with us in spirit as we celebrate this beautiful new chapter.</p>
    <p style="margin:0 0 6px;font-size:14px;color:#694332;line-height:1.7;">With so much love and gratitude,</p>
    <p style="margin:0;font-size:13px;color:#B5522B;font-style:italic;">Uju &amp; Chinedu</p>
    <p style="margin:8px 0 0;font-size:11px;color:#90713f;letter-spacing:0.18em;text-transform:uppercase;">#TheCUStory'26</p>
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
<body style="margin:0;padding:0;background:#fbf6ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ef;padding:24px 0;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f0ddc0;">
<tr>
  <td align="center" style="background:#B5522B;padding:32px 20px 26px;">
    <p style="margin:0;font-family:'Great Vibes','Times New Roman',serif;font-size:30px;color:#fff;">Uju &amp; Chinedu</p>
    <p style="margin:10px 0 0;font-family:'Cormorant Garamond','Times New Roman',serif;font-size:17px;color:#f9e7bf;font-style:italic;">You're officially on the list 🎉</p>
  </td>
</tr>
<tr>
  <td style="padding:28px 24px 8px;">
    <p style="margin:0 0 14px;font-size:15px;color:#4a2816;">Dear ${fullName},</p>
    <p style="margin:0 0 14px;font-size:14px;color:#694332;line-height:1.7;">We're so excited to have you celebrate with us in person! Your RSVP has been received and your spot is confirmed.</p>
    <p style="margin:0 0 14px;font-size:14px;color:#694332;line-height:1.7;">Your personal wedding invitation is attached to this email as a PDF. Please download and keep it safe — you'll need to present it at the venue for entry.</p>
  </td>
</tr>
<tr>
  <td style="padding:0 24px 28px;">
    <p style="margin:0 0 4px;font-size:13px;color:#694332;line-height:1.6;">We can't wait to celebrate with you.</p>
    <p style="margin:0 0 6px;font-size:13px;color:#694332;">With Love, Uju &amp; Chinedu</p>
    <p style="margin:0;font-size:11px;color:#90713f;letter-spacing:0.18em;text-transform:uppercase;">#TheCUStory'26</p>
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
  category: string;
  attending: boolean;
  timestamp: string;
}): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <title>New RSVP — ${payload.fullName}</title>
    </head>
    <body style="margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background-color:#fbf6ef;">
      <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:10px;border:1px solid #f0ddc0;">
        <tr>
          <td style="padding:16px 18px 4px 18px;">
            <h1 style="margin:0 0 6px 0;font-size:17px;color:#4a2816;">New RSVP Received</h1>
            <p style="margin:0;font-size:12px;color:#90713f;">Wedding of Uju &amp; Chinedu — #TheCUStory'26</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 18px 18px 18px;">
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style="font-size:13px;color:#5f3a28;border-collapse:collapse;">
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
                <td style="padding:6px 4px;font-weight:600;">Category</td>
                <td style="padding:6px 4px;">${payload.category}</td>
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
    const category = (body.category ?? "").trim();
    const attending = Boolean(body.attending);

    if (!fullName || !phone || !email || !category) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
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

    const sheet1Rows = await getSheet1Rows();
    const emailExists = sheet1Rows.some(
      (row) => row[3]?.trim().toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      return NextResponse.json(
        { error: "This email address has already been used to RSVP." },
        { status: 409 }
      );
    }

    const timestamp = new Date().toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      dateStyle: "medium",
      timeStyle: "short",
    });

    await Promise.all([
      getSheetsClient().spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A:F",
        valueInputOption: "RAW",
        requestBody: {
          values: [[timestamp, fullName, phone, email, category, attending ? "Yes" : "No"]],
        },
      }),
      resend.emails.send({
        from: `CUStory <${process.env.RESEND_FROM_EMAIL!}>`,
        to: email,
        subject: attending
          ? "You're Invited — Uju & Chinedu Wedding 🎉"
          : "Thank You for Your RSVP — Uju & Chinedu",
        html: buildGuestEmailHtml(fullName, attending),
        attachments: attending
          ? [
              {
                filename: "invite.jpeg",
                path: INVITE_IMAGE_URL,
              },
            ]
          : undefined,
      }),
      resend.emails.send({
        from: `CUStory <${process.env.RESEND_FROM_EMAIL!}>`,
        to: process.env.ORGANISER_EMAIL!,
        subject: `New RSVP — ${fullName}`,
        html: buildOrganiserEmailHtml({
          fullName,
          phone,
          email,
          category,
          attending,
          timestamp,
        }),
        attachments: attending
          ? [
              {
                filename: "invite.jpeg",
                path: INVITE_IMAGE_URL,
              },
            ]
          : undefined,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Unable to process RSVP at this time." },
      { status: 500 }
    );
  }
}