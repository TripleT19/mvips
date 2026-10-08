<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>New enquiry</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#172033;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
        <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">

                <tr>
                    <td style="background:#252B68;padding:28px 32px;">
                        <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#FFE900;">
                            Mount View International
                        </p>
                        <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.25;">
                            New Contact Enquiry
                        </h1>
                    </td>
                </tr>

                <tr>
                    <td style="padding:28px 32px 8px;">
                        <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#F58220;">
                            Enquiry Type
                        </p>
                        <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#252B68;">
                            {{ ucfirst(str_replace('-', ' ', $contact->enquiry_type)) }}
                        </p>
                    </td>
                </tr>

                <tr>
                    <td style="padding:24px 32px 8px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">

                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;width:150px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">
                                    Full Name
                                </td>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:15px;color:#172033;font-weight:600;">
                                    {{ $contact->full_name }}
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">
                                    Email
                                </td>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:15px;color:#172033;font-weight:600;">
                                    <a href="mailto:{{ $contact->email }}" style="color:#F58220;text-decoration:none;">
                                        {{ $contact->email }}
                                    </a>
                                </td>
                            </tr>

                            @if ($contact->phone)
                                <tr>
                                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">
                                        Phone
                                    </td>
                                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:15px;color:#172033;font-weight:600;">
                                        {{ $contact->phone }}
                                    </td>
                                </tr>
                            @endif

                            @if ($contact->child_name)
                                <tr>
                                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">
                                        Child's Name
                                    </td>
                                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:15px;color:#172033;font-weight:600;">
                                        {{ $contact->child_name }}
                                    </td>
                                </tr>
                            @endif

                            @if ($contact->class_name)
                                <tr>
                                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">
                                        Class
                                    </td>
                                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:15px;color:#172033;font-weight:600;">
                                        {{ $contact->class_name }}
                                    </td>
                                </tr>
                            @endif

                        </table>
                    </td>
                </tr>

                <tr>
                    <td style="padding:20px 32px 32px;">
                        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">
                            Message
                        </p>
                        <div style="background:#f8fafc;border-left:4px solid #F58220;padding:16px 20px;border-radius:8px;font-size:15px;line-height:1.7;color:#334155;white-space:pre-wrap;">{{ $contact->message }}</div>
                    </td>
                </tr>

                <tr>
                    <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;">
                            Received {{ $contact->created_at->format('d M Y, H:i') }} from {{ $contact->ip_address }}.
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>