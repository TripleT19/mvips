<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminSetPasswordNotification extends Notification
{
    use Queueable;

    public string $token;

    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        | This must be the URL of the NEXT.JS frontend,
        | NOT the Laravel backend.
        |
        | Example:
        | FRONTEND_URL=https://your-nextjs-site.com
        |
        */

        $frontendUrl = config('app.frontend_url');

        if (!$frontendUrl) {
            $frontendUrl = env('FRONTEND_URL');
        }

        if (!$frontendUrl) {
            $frontendUrl = 'http://localhost:3000';
        }

        $frontendUrl = rtrim(trim($frontendUrl), '/');

        /*
        |--------------------------------------------------------------------------
        | Build activation/reset URL
        |--------------------------------------------------------------------------
        */

        $url = $frontendUrl
            . '/admin/activate-account?token='
            . rawurlencode($this->token)
            . '&email='
            . rawurlencode($notifiable->email);

        /*
        |--------------------------------------------------------------------------
        | Determine email type
        |--------------------------------------------------------------------------
        */

        if ($notifiable->is_active) {

            $subject = 'Reset Your Mount View Administration Password';

            $heading = 'Reset Your Password';

            $intro =
                'A password reset has been requested for your Mount View administration account.';

            $bodyText =
                'Click the button below to create a new password for your administration account.';

            $buttonText = 'Reset My Password';

        } else {

            $subject = 'Activate Your Mount View Administration Account';

            $heading = 'Welcome to Mount View Administration';

            $intro =
                'An administration account has been created for you at Mount View International Primary School & Early Years Centre.';

            $bodyText =
                'To activate your account, click the button below and create your password.';

            $buttonText = 'Activate My Account';
        }

        return (new MailMessage)
            ->subject($subject)
            ->view(
                'emails.admin.account-access',
                [
                    'notifiable' => $notifiable,
                    'url' => $url,
                    'heading' => $heading,
                    'intro' => $intro,
                    'bodyText' => $bodyText,
                    'buttonText' => $buttonText,
                ]
            );
    }
}