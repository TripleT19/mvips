<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Mount View Administration</title>
</head>

<body
    style="
        margin:0;
        padding:0;
        background:#f3f5fb;
        font-family:Arial, Helvetica, sans-serif;
        color:#172033;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        background:#f3f5fb;
        padding:35px 15px;
    "
>
    <tr>
        <td align="center">

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                    max-width:620px;
                    background:#ffffff;
                    border-radius:16px;
                    overflow:hidden;
                    box-shadow:0 8px 30px rgba(37,43,104,0.10);
                "
            >

                <!-- BRAND HEADER -->

                <tr>
                    <td
                        align="center"
                        style="
                            background:#252B68;
                            padding:30px 25px;
                        "
                    >

                        <img
                            src="{{ asset('logo.jpg') }}"
                            alt="Mount View International Primary School"
                            style="
                                display:block;
                                max-width:180px;
                                width:auto;
                                height:auto;
                                margin:0 auto 18px auto;
                                border:0;
                            "
                        >

                        <div
                            style="
                                color:#ffffff;
                                font-size:20px;
                                font-weight:bold;
                                line-height:1.35;
                            "
                        >
                            Mount View International
                            Primary School &amp;
                            Early Years Centre
                        </div>

                        <div
                            style="
                                color:#FFE900;
                                font-size:13px;
                                font-weight:bold;
                                margin-top:8px;
                                letter-spacing:0.4px;
                            "
                        >
                            Fostering growth, excellence and empathy
                        </div>

                    </td>
                </tr>


                <!-- ORANGE STRIPE -->

                <tr>
                    <td
                        style="
                            height:5px;
                            background:#F58220;
                            font-size:0;
                            line-height:0;
                        "
                    >
                        &nbsp;
                    </td>
                </tr>


                <!-- CONTENT -->

                <tr>
                    <td
                        style="
                            padding:42px 42px 30px 42px;
                        "
                    >

                        <h1
                            style="
                                margin:0 0 18px 0;
                                color:#252B68;
                                font-size:27px;
                                line-height:1.3;
                                font-weight:700;
                            "
                        >
                            {{ $heading }}
                        </h1>


                        <p
                            style="
                                margin:0 0 18px 0;
                                font-size:16px;
                                line-height:1.7;
                                color:#172033;
                            "
                        >
                            Hello {{ $notifiable->name }},
                        </p>


                        <p
                            style="
                                margin:0 0 18px 0;
                                font-size:16px;
                                line-height:1.7;
                                color:#4b5563;
                            "
                        >
                            {{ $intro }}
                        </p>


                        <p
                            style="
                                margin:0 0 28px 0;
                                font-size:16px;
                                line-height:1.7;
                                color:#4b5563;
                            "
                        >
                            {{ $bodyText }}
                        </p>


                        <!-- ACTION BUTTON -->

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                        >
                            <tr>
                                <td align="center">

                                    <a
                                        href="{{ $url }}"
                                        style="
                                            display:inline-block;
                                            background:#F58220;
                                            color:#ffffff;
                                            text-decoration:none;
                                            font-size:16px;
                                            font-weight:bold;
                                            padding:15px 30px;
                                            border-radius:8px;
                                        "
                                    >
                                        {{ $buttonText }}
                                    </a>

                                </td>
                            </tr>
                        </table>


                        <!-- FALLBACK LINK -->

                        <p
                            style="
                                margin:30px 0 8px 0;
                                font-size:13px;
                                line-height:1.6;
                                color:#6b7280;
                            "
                        >
                            If the button above does not work, copy and paste
                            the following link into your browser:
                        </p>

                        <p
                            style="
                                margin:0;
                                word-break:break-all;
                                font-size:12px;
                                line-height:1.6;
                                color:#252B68;
                            "
                        >
                            {{ $url }}
                        </p>


                        <!-- SECURITY NOTICE -->

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                                margin-top:30px;
                                background:#fff9d9;
                                border-left:4px solid #FFE900;
                            "
                        >
                            <tr>
                                <td
                                    style="
                                        padding:16px 18px;
                                    "
                                >

                                    <strong
                                        style="
                                            display:block;
                                            color:#252B68;
                                            margin-bottom:6px;
                                            font-size:14px;
                                        "
                                    >
                                        Security Notice
                                    </strong>

                                    <span
                                        style="
                                            color:#5b6475;
                                            font-size:13px;
                                            line-height:1.6;
                                        "
                                    >
                                        This secure link is intended only for
                                        you and will expire according to the
                                        school's configured password reset
                                        period. If you did not expect this
                                        email, please contact the school
                                        administrator.
                                    </span>

                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>


                <!-- FOOTER -->

                <tr>
                    <td
                        style="
                            background:#171B4A;
                            padding:25px 30px;
                            text-align:center;
                        "
                    >

                        <div
                            style="
                                color:#ffffff;
                                font-size:14px;
                                font-weight:bold;
                                margin-bottom:8px;
                            "
                        >
                            Mount View International Primary School
                            &amp; Early Years Centre
                        </div>

                        <div
                            style="
                                color:#cbd0e5;
                                font-size:12px;
                                line-height:1.6;
                            "
                        >
                            Fostering growth, excellence and empathy
                        </div>

                        <div
                            style="
                                color:#cbd0e5;
                                font-size:12px;
                                line-height:1.6;
                                margin-top:8px;
                            "
                        >
                            Maone Park, Limbe, Blantyre, Malawi
                        </div>

                        <div
                            style="
                                color:#FFE900;
                                font-size:12px;
                                margin-top:12px;
                            "
                        >
                            0881 668 001
                            &nbsp; | &nbsp;
                            info@mountviewmw.com
                        </div>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>