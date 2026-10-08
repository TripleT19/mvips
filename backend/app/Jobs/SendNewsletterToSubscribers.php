<?php

namespace App\Jobs;

use App\Mail\NewsletterPublishedMail;
use App\Models\Newsletter;
use App\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendNewsletterToSubscribers implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $newsletterId)
    {
    }

    public function handle(): void
    {
        $newsletter = Newsletter::find($this->newsletterId);

        if (!$newsletter || $newsletter->status !== 'published') {
            return;
        }

        NewsletterSubscriber::active()
            ->orderBy('id')
            ->chunk(50, function ($subscribers) use ($newsletter) {
                foreach ($subscribers as $subscriber) {
                    try {
                        Mail::to($subscriber->email)
                            ->send(new NewsletterPublishedMail($newsletter, $subscriber));
                    } catch (\Throwable $e) {
                        Log::error('Newsletter email failed', [
                            'newsletter_id' => $newsletter->id,
                            'subscriber_id' => $subscriber->id,
                            'email' => $subscriber->email,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });
    }
}