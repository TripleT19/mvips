<?php

namespace App\Notifications;

use App\Models\Alumnus;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AlumniSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(public Alumnus $alumnus) {}

    /**
     * In-app bell (database) + email. Drop 'mail' if you only want
     * the admin bell badge.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Stored in the notifications table — picked up by the admin
     * bell / dashboard notification widget.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type'          => 'alumni.submitted',
            'alumnus_id'    => $this->alumnus->id,
            'full_name'     => $this->alumnus->full_name,
            'year_left'     => $this->alumnus->year_left,
            'current_role'  => $this->alumnus->current_role,
            'organization'  => $this->alumnus->organization,
            'location'      => $this->alumnus->location,
            'message'       => "New alumni submission from {$this->alumnus->full_name} (Class of {$this->alumnus->year_left}).",
            'url'           => '/admin/alumni',
            'created_at'    => now()->toIso8601String(),
        ];
    }

    /**
     * Email sent to admins / headteachers.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $role = $this->alumnus->current_role;
        $org  = $this->alumnus->organization;

        $mail = (new MailMessage())
            ->subject("New Alumni Submission — {$this->alumnus->full_name}")
            ->greeting("Hello {$notifiable->name},")
            ->line('A new alumni submission has arrived and is awaiting your review.')
            ->line("**Name:** {$this->alumnus->full_name}")
            ->line("**Class of:** {$this->alumnus->year_left}")
            ->line('**Current role:** ' . $role . ($org ? " at {$org}" : ''))
            ->line("**Location:** {$this->alumnus->location}");

        if ($this->alumnus->email) {
            $mail->line("**Email:** {$this->alumnus->email}");
        }
        if ($this->alumnus->phone) {
            $mail->line("**Phone:** {$this->alumnus->phone}");
        }

        if ($this->alumnus->bio) {
            $mail->line('**Bio:** ' . \Illuminate\Support\Str::limit($this->alumnus->bio, 200));
        }

        return $mail
            ->action('Review submission', url('/admin/alumni'))
            ->line('Approving this submission will publish it to the public alumni directory.');
    }
}