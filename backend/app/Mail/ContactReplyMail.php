<?php

namespace App\Mail;

use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ContactMessage $contact,
        public string $replyBody,
        public ?User $repliedBy = null
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Re: Your enquiry to Mount View International',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-reply',
            with: [
                'contact'    => $this->contact,
                'replyBody'  => $this->replyBody,
                'repliedBy'  => $this->repliedBy,
                'schoolName' => 'Mount View International Primary School & Early Years Centre',
            ],
        );
    }
}