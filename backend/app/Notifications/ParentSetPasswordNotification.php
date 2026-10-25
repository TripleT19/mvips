<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ParentSetPasswordNotification extends Notification
{
    use Queueable;

    public const TYPE_ACTIVATION = 'activation';
    public const TYPE_RESET      = 'reset';

    public function __construct(
        public string $token,
        public string $type = self::TYPE_ACTIVATION
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $isActivation = $this->type === self::TYPE_ACTIVATION;

        $base = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        $path = $isActivation
            ? '/parent/activate'
            : '/parent/reset-password';

        $url = $base . $path . '?' . http_build_query([
            'token' => $this->token,
            'email' => $notifiable->email,
        ]);

        return (new MailMessage)
            ->subject($isActivation
                ? 'Activate your Mount View Parent Portal'
                : 'Reset your Mount View Parent Portal password')
            ->view('emails.admin.account-access', [
                'heading'    => $isActivation
                    ? 'Activate Your Parent Portal'
                    : 'Reset Your Password',
                'intro'      => $isActivation
                    ? 'An account has been created for you on the Mount View Parent Portal so you can view your child\'s academic results, attendance and teacher observations.'
                    : 'We received a request to reset your Parent Portal password.',
                'bodyText'   => $isActivation
                    ? 'Click the button below to set a secure password and activate your account. This link will expire in 60 minutes.'
                    : 'Click the button below to set a new password. This link will expire in 60 minutes.',
                'buttonText' => $isActivation
                    ? 'Activate My Account'
                    : 'Reset My Password',
                'url'        => $url,
                'notifiable' => $notifiable,
            ]);
    }
}