<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reply from Mount View</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#172033;-webkit-font-smoothing:antialiased;">

<div style="display:none;max-height:0;overflow:hidden;color:transparent;">
    A reply to your enquiry from Mount View International
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
        <td align="center">

            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">

                {{-- Header --}}
                <tr>
                    <td style="background:#252B68;padding:28px 32px;">
                        <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#FFE900;">
                            Mount View International
                        </p>
                        <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.25;">
                            Reply to your enquiry
                        </h1>
                    </td>
                </tr>

                {{-- Greeting --}}
                <tr>
                    <td style="padding:28px 32px 0;">
                        <p style="margin:0;font-size:16px;line-height:1.7;color:#334155;">
                            Dear {{ $contact->full_name }},
                        </p>

                        <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#475569;">
                            Thank you for getting in touch with Mount View International Primary School &amp; Early Years Centre.
                            Here is our reply to your enquiry:
                        </p>
                    </td>
                </tr>

                {{-- Reply body --}}
                <tr>
                    <td style="padding:20px 32px 0;">
                        <div style="background:#f8fafc;border-left:4px solid #F58220;padding:18px 22px;border-radius:8px;font-size:15px;line-height:1.75;color:#334155;white-space:pre-wrap;">{{ $replyBody }}</div>
                    </td>
                </tr>

                {{-- Original message (collapsed look) --}}
                <tr>
                    <td style="padding:28px 32px 0;">
                        <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#94a3b8;">
                            Your original message
                        </p>

                        <div style="margin-top:10px;background:#f1f5f9;border-radius:8px;padding:14px 18px;font-size:13px;line-height:1.7;color:#64748b;white-space:pre-wrap;">{{ $contact->message }}</div>

                        <p style="margin:10px 0 0;font-size:11px;color:#94a3b8;">
                            Sent {{ $contact->created_at->format('d M Y, H:i') }}
                        </p>
                    </td>
                </tr>

                {{-- Sign-off --}}
                <tr>
                    <td style="padding:28px 32px 32px;">
                        <p style="margin:0;font-size:15px;line-height:1.7;color:#334155;">
                            If you have any other questions, just reply to this email and we&apos;ll get back to you.
                        </p>

                        <p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#334155;">
                            Kind regards,<br>
                            <strong style="color:#252B68;">
                                {{ $repliedBy?->name ?: 'The Mount View Team' }}
                            </strong><br>
                            <span style="font-size:13px;color:#64748b;">
                                Mount View International Primary School &amp; Early Years Centre
                            </span>
                        </p>
                    </td>
                </tr>

                {{-- Footer --}}
                <tr>
                    <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                            Mount View International Primary School &amp; Early Years Centre<br>
                            Blantyre, Malawi<br>
                            <a href="mailto:info@mountviewmw.com" style="color:#94a3b8;text-decoration:underline;">info@mountviewmw.com</a>
                            &nbsp;·&nbsp;
                            <a href="tel:+265881668001" style="color:#94a3b8;text-decoration:underline;">0881 668 001</a>
                        </p>
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>