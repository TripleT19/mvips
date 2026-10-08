<?php

namespace App\Mail;

use App\Models\Newsletter;
use App\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

class NewsletterPublishedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Newsletter $newsletter,
        public NewsletterSubscriber $subscriber
    ) {
    }

    /**
     * Envelope: subject, sender, plus List-Unsubscribe headers that
     * mailbox providers use for one-click unsubscribe.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Newsletter: ' . $this->newsletter->title,
        );
    }

    /**
     * Headers: standard List-Unsubscribe pointing at our frontend page.
     * Gmail / Outlook will show their native unsubscribe button when
     * these headers are present.
     */
    public function headers(): Headers
    {
        $unsubscribeUrl = $this->frontendUrl(
            "/newsletters/unsubscribe/{$this->subscriber->unsubscribe_token}"
        );

        return new Headers(
            text: [
                'List-Unsubscribe' => "<{$unsubscribeUrl}>",
                'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click',
            ],
        );
    }

    /**
     * Content: HTML body variables.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.newsletter-published',
            with: [
                'newsletter'    => $this->newsletter,
                'subscriber'    => $this->subscriber,
                'downloadUrl'   => $this->apiUrl(
                    "/api/newsletters/{$this->newsletter->slug}/download"
                ),
                'publicUrl'     => $this->frontendUrl('/newsletters'),
                'unsubscribeUrl' => $this->frontendUrl(
                    "/newsletters/unsubscribe/{$this->subscriber->unsubscribe_token}"
                ),
                'logoUrl'       => $this->frontendUrl('/logo.jpg'),
            ],
        );
    }

    /**
     * Build an absolute URL pointing at the API (backend) host.
     */
    private function apiUrl(string $path): string
    {
        $base = rtrim(config('app.url', env('APP_URL', 'http://localhost')), '/');
        $path = '/' . ltrim($path, '/');

        return $base . $path;
    }

    /**
     * Build an absolute URL pointing at the frontend host.
     */
    private function frontendUrl(string $path): string
    {
        $base = rtrim(
            config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')),
            '/'
        );
        $path = '/' . ltrim($path, '/');

        return $base . $path;
    }
}