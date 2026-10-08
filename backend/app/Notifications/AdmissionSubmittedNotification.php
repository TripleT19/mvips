<?php

namespace App\Notifications;

use App\Models\AdmissionApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AdmissionSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public AdmissionApplication $application
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'New admission application',
            'message' => sprintf(
                '%s submitted an application for %s (%s).',
                trim(
                    ($this->application->legal_first_name ?? '') . ' ' .
                    ($this->application->legal_surname ?? '')
                ) ?: 'A parent',
                optional($this->application->classApplied)->name ?: 'an unspecified class',
                $this->application->application_number
            ),
            'application_id' => $this->application->id,
            'application_number' => $this->application->application_number,
            'url' => '/admin/admissions?application=' . $this->application->id,
        ];
    }
}