<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>{{ $newsletter->title }}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#172033;-webkit-font-smoothing:antialiased;">

<!-- Preheader (shown in the inbox preview) -->
<div style="display:none;max-height:0;overflow:hidden;color:transparent;">
    New newsletter from Mount View International: {{ $newsletter->title }}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
        <td align="center">

            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">

                {{-- ============================================================
                     Header
                ============================================================ --}}
                <tr>
                    <td style="background:#252B68;padding:32px 32px 28px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td valign="middle" style="width:56px;">
                                    <img src="{{ $logoUrl }}"
                                         alt="Mount View"
                                         width="48"
                                         height="48"
                                         style="display:block;border-radius:12px;background:#ffffff;padding:4px;box-sizing:border-box;">
                                </td>
                                <td valign="middle" style="padding-left:14px;">
                                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#FFE900;">
                                        Mount View International
                                    </p>
                                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#cbd5e1;">
                                        Primary School &amp; Early Years Centre
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- ============================================================
                     Hero label + title
                ============================================================ --}}
                <tr>
                    <td style="padding:32px 32px 8px;">
                        <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#F58220;">
                            {{ $newsletter->term ? $newsletter->term . ' · ' : '' }}{{ $newsletter->year }}
                        </p>

                        <h1 style="margin:10px 0 0;font-size:26px;font-weight:800;line-height:1.25;color:#252B68;">
                            {{ $newsletter->title }}
                        </h1>
                    </td>
                </tr>

                {{-- ============================================================
                     Cover image
                ============================================================ --}}
                @if ($newsletter->cover_image_url)
                    <tr>
                        <td style="padding:20px 32px 0;">
                            <div style="border-radius:12px;overflow:hidden;">
                                <img src="{{ $newsletter->cover_image_url }}"
                                     alt="{{ $newsletter->title }}"
                                     style="display:block;width:100%;height:auto;border-radius:12px;">
                            </div>
                        </td>
                    </tr>
                @endif

                {{-- ============================================================
                     Description
                ============================================================ --}}
                <tr>
                    <td style="padding:24px 32px 0;">
                        @if ($newsletter->description)
                            <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">
                                {{ $newsletter->description }}
                            </p>
                        @else
                            <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">
                                A new edition of the Mount View newsletter is now available.
                                Download the PDF below to catch up on school news, events,
                                and everything happening in our community.
                            </p>
                        @endif
                    </td>
                </tr>

                {{-- ============================================================
                     CTAs
                ============================================================ --}}
                <tr>
                    <td style="padding:28px 32px 32px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="padding-right:10px;">
                                    <a href="{{ $downloadUrl }}"
                                       style="display:inline-block;background:#F58220;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:14px 26px;border-radius:999px;">
                                        Download PDF
                                    </a>
                                </td>
                                <td>
                                    <a href="{{ $publicUrl }}"
                                       style="display:inline-block;color:#252B68;text-decoration:none;font-weight:800;font-size:14px;padding:14px 26px;border-radius:999px;border:2px solid #e2e8f0;">
                                        View on Website
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- ============================================================
                     Divider
                ============================================================ --}}
                <tr>
                    <td style="padding:0 32px;">
                        <div style="height:1px;background:#e2e8f0;"></div>
                    </td>
                </tr>

                {{-- ============================================================
                     Footer
                ============================================================ --}}
                <tr>
                    <td style="padding:24px 32px 32px;">

                        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                            You are receiving this email because
                            <strong style="color:#172033;">{{ $subscriber->email }}</strong>
                            @if ($subscriber->name)
                                ({{ $subscriber->name }})
                            @endif
                            subscribed to Mount View newsletters.
                        </p>

                        <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
                            <a href="{{ $unsubscribeUrl }}"
                               style="color:#F58220;text-decoration:underline;font-weight:600;">
                                Unsubscribe from this list
                            </a>
                            &nbsp;·&nbsp;
                            <a href="{{ $publicUrl }}"
                               style="color:#F58220;text-decoration:underline;font-weight:600;">
                                Newsletter archive
                            </a>
                        </p>

                        <p style="margin:22px 0 0;font-size:11px;line-height:1.7;color:#94a3b8;">
                            Mount View International Primary School &amp; Early Years Centre<br>
                            Blantyre, Malawi<br>
                            <a href="mailto:info@mountviewmw.com"
                               style="color:#94a3b8;text-decoration:underline;">
                                info@mountviewmw.com
                            </a>
                        </p>

                    </td>
                </tr>

            </table>

            {{-- Legal footer outside the card --}}
            <p style="margin:20px 0 0;font-size:11px;line-height:1.6;color:#94a3b8;text-align:center;max-width:520px;">
                Mount View International Primary School &amp; Early Years Centre<br>
                You received this email because you subscribed to our newsletter list.
                You can unsubscribe at any time using the link above.
            </p>

        </td>
    </tr>
</table>

</body>
</html>