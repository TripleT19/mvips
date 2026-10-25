<?php

namespace App\Notifications;

use App\Models\AdmissionApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AssessmentPassedNotification extends Notification
{
    use Queueable;

    public function __construct(public AdmissionApplication $application) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $name = trim("{$this->application->legal_first_name} {$this->application->legal_surname}");

        return (new MailMessage)
            ->subject('Assessment passed — decision required: ' . $this->application->application_number)
            ->greeting("Hello {$notifiable->name},")
            ->line("The entrance assessment for {$name} ({$this->application->application_number}) has been completed and passed.")
            ->line('Please review the application and record the admission decision.')
            ->action('Review application', url("/admin/admissions?application={$this->application->id}"))
            ->line('Mount View International Primary School');
    }

    public function toArray($notifiable): array
    {
        $name = trim("{$this->application->legal_first_name} {$this->application->legal_surname}");

        return [
            'title' => 'Assessment passed — decision required',
            'message' => "{$name} ({$this->application->application_number}) passed the assessment.",
            'application_id' => $this->application->id,
            'application_number' => $this->application->application_number,
            'url' => "/admin/admissions?application={$this->application->id}",
        ];
    }
}