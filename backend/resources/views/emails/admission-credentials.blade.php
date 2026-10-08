<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Mount View admission access details</title>
</head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.05);">
    <div style="background:#252B68;padding:24px;color:#ffffff;">
      <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#FFE900;font-weight:700;">
        Mount View International
      </p>
      <h1 style="margin:6px 0 0;font-size:20px;">
        Your admission access details
      </h1>
    </div>

    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4b5563;">
        Thank you for starting your Mount View admission application.
        Keep the following details safe — you will need them to return to
        your application, continue a draft, or check its status.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;font-weight:700;">
          Application Number
        </p>
        <p style="margin:4px 0 16px;font-size:18px;font-weight:800;color:#252B68;font-family:Menlo,monospace;">
          {{ $application->application_number }}
        </p>

        <p style="margin:0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;font-weight:700;">
          Access Token
        </p>
        <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#252B68;word-break:break-all;font-family:Menlo,monospace;">
          {{ $token }}
        </p>
      </div>

      <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#4b5563;">
        Visit the admissions page, click <strong>Continue / Track Application</strong>,
        and enter both values above.
      </p>

      <p style="margin:0;font-size:12px;color:#94a3b8;">
        If you did not start this application, you can safely ignore this email.
      </p>
    </div>

    <div style="padding:16px 24px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center;">
      Mount View International Primary School &amp; Early Years Centre
    </div>
  </div>
</body>
</html>