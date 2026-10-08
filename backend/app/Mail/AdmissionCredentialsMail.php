<?php

namespace App\Mail;

use App\Models\AdmissionApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdmissionCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public AdmissionApplication $application,
        public string $plainToken,
        public bool $isResend = false
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->isResend
                ? 'Your Mount View admission access details (resend)'
                : 'Your Mount View admission access details'
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admission-credentials',
            with: [
                'application' => $this->application,
                'token' => $this->plainToken,
                'isResend' => $this->isResend,
            ],
        );
    }
}