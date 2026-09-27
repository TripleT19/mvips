<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        {{ $isActive
            ? 'Reset Your Password'
            : 'Activate Your Account'
        }}
    </title>

    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f6fb;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
            color: #172033;
        }

        table {
            border-spacing: 0;
            border-collapse: collapse;
        }

        .wrapper {
            width: 100%;
            background-color: #f4f6fb;
            padding: 35px 15px;
        }

        .container {
            width: 100%;
            max-width: 620px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 18px;
            overflow: hidden;
            box-shadow:
                0 10px 35px rgba(37, 43, 104, 0.10);
        }

        .top-bar {
            height: 7px;
            background-color: #ffe900;
        }

        .header {
            background-color: #252b68;
            padding: 35px 30px;
            text-align: center;
        }

        .logo-wrapper {
            width: 105px;
            height: 105px;
            margin: 0 auto 20px auto;
            background-color: #ffffff;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .logo {
            max-width: 85px;
            max-height: 85px;
            display: block;
        }

        .school-name {
            margin: 0;
            color: #ffffff;
            font-size: 22px;
            line-height: 1.35;
            font-weight: 700;
        }

        .tagline {
            margin: 8px 0 0 0;
            color: #ffe900;
            font-size: 13px;
            font-weight: 600;
        }

        .content {
            padding: 40px 40px 35px 40px;
        }

        .welcome {
            margin: 0 0 12px 0;
            color: #252b68;
            font-size: 27px;
            line-height: 1.3;
            font-weight: 700;
        }

        .intro {
            margin: 0 0 22px 0;
            font-size: 15px;
            line-height: 1.7;
            color: #526070;
        }

        .account-box {
            background-color: #f7f8fc;
            border-left: 5px solid #f58220;
            border-radius: 10px;
            padding: 18px 20px;
            margin: 25px 0;
        }

        .account-label {
            margin: 0 0 5px 0;
            color: #7b8494;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            font-weight: 700;
        }

        .account-email {
            margin: 0;
            color: #252b68;
            font-size: 16px;
            font-weight: 700;
            word-break: break-word;
        }

        .button-wrapper {
            text-align: center;
            padding: 12px 0 25px 0;
        }

        .button {
            display: inline-block;
            background-color: #f58220;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 15px;
            font-weight: 700;
            padding: 15px 28px;
            border-radius: 9px;
        }

        .button:hover {
            background-color: #d96d12;
        }

        .expiry {
            margin: 0;
            padding: 15px 18px;
            background-color: #fff9d6;
            border-radius: 9px;
            color: #665c00;
            font-size: 13px;
            line-height: 1.6;
        }

        .security {
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid #e8eaf0;
        }

        .security-title {
            margin: 0 0 8px 0;
            color: #252b68;
            font-size: 14px;
            font-weight: 700;
        }

        .security-text {
            margin: 0;
            color: #687384;
            font-size: 13px;
            line-height: 1.6;
        }

        .footer {
            background-color: #171b4a;
            padding: 28px 30px;
            text-align: center;
        }

        .footer-school {
            margin: 0 0 7px 0;
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
        }

        .footer-text {
            margin: 0;
            color: #bfc4dc;
            font-size: 12px;
            line-height: 1.6;
        }

        .footer-contact {
            margin-top: 10px;
            color: #ffe900;
            font-size: 12px;
        }

        .fallback {
            margin-top: 18px;
            color: #8a92a0;
            font-size: 11px;
            line-height: 1.5;
            word-break: break-all;
        }

        @media only screen and (max-width: 600px) {
            .wrapper {
                padding: 15px 8px;
            }

            .header {
                padding: 28px 20px;
            }

            .content {
                padding: 30px 22px;
            }

            .welcome {
                font-size: 23px;
            }

            .school-name {
                font-size: 19px;
            }

            .button {
                display: block;
                width: auto;
            }
        }
    </style>
</head>

<body>

<table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
>
    <tr>
        <td class="wrapper">

            <table
                role="presentation"
                class="container"
                cellpadding="0"
                cellspacing="0"
                align="center"
            >

                <!-- Yellow top line -->
                <tr>
                    <td class="top-bar"></td>
                </tr>

                <!-- Header -->
                <tr>
                    <td class="header">

                        <div class="logo-wrapper">

                            <img
                                src="{{ $logoUrl }}"
                                alt="Mount View International Primary School"
                                class="logo"
                            >

                        </div>

                        <h1 class="school-name">
                            Mount View International<br>
                            Primary School &amp; Early Years Centre
                        </h1>

                        <p class="tagline">
                            Fostering growth, excellence and empathy
                        </p>

                    </td>
                </tr>

                <!-- Main content -->
                <tr>
                    <td class="content">

                        @if ($isActive)

                            <h2 class="welcome">
                                Password Reset
                            </h2>

                            <p class="intro">
                                Hello {{ $user->name }},
                            </p>

                            <p class="intro">
                                A request has been made to reset the password
                                for your Mount View administration account.
                                You can create a new password by clicking
                                the button below.
                            </p>

                        @else

                            <h2 class="welcome">
                                Welcome, {{ $user->name }}!
                            </h2>

                            <p class="intro">
                                Your Mount View administration account has
                                been created successfully.
                            </p>

                            <p class="intro">
                                To complete your account setup, please click
                                the button below and create your own secure
                                password.
                            </p>

                        @endif

                        <!-- Account information -->
                        <div class="account-box">

                            <p class="account-label">
                                Administration Account
                            </p>

                            <p class="account-email">
                                {{ $user->email }}
                            </p>

                        </div>

                        <!-- Action -->
                        <div class="button-wrapper">

                            <a
                                href="{{ $url }}"
                                class="button"
                            >
                                {{ $isActive
                                    ? 'Reset My Password'
                                    : 'Activate My Account'
                                }}
                            </a>

                        </div>

                        <!-- Expiry -->
                        <p class="expiry">

                            <strong>Important:</strong>
                            This secure link will expire in
                            <strong>60 minutes</strong>.
                            For your security, please do not share this
                            email or activation link with anyone else.

                        </p>

                        <!-- Security information -->
                        <div class="security">

                            <p class="security-title">
                                Didn't request this?
                            </p>

                            <p class="security-text">
                                @if ($isActive)
                                    If you did not request a password reset,
                                    you can safely ignore this email.
                                    Your existing password will remain
                                    unchanged.
                                @else
                                    If you were not expecting an
                                    administration account from Mount View,
                                    please contact the school administration.
                                @endif
                            </p>

                        </div>

                        <!-- Fallback link -->
                        <p class="fallback">

                            If the button does not work, copy and paste this
                            link into your browser:

                            <br><br>

                            {{ $url }}

                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td class="footer">

                        <p class="footer-school">
                            Mount View International Primary School
                            &amp; Early Years Centre
                        </p>

                        <p class="footer-text">
                            Fostering growth, excellence and empathy
                        </p>

                        <p class="footer-contact">
                            Blantyre, Malawi &nbsp; | &nbsp;
                            0881 668 001 &nbsp; | &nbsp;
                            info@mountviewmw.com
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>