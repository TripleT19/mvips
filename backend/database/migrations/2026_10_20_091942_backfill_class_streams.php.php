<?php

use App\Models\SchoolClass;
use App\Models\ClassStream;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        SchoolClass::with('stream')
            ->whereNotNull('stream_id')
            ->get()
            ->each(function (SchoolClass $class) {
                if (!$class->stream) return;

                ClassStream::firstOrCreate(
                    [
                        'school_class_id' => $class->id,
                        'stream_id' => $class->stream_id,
                    ],
                    [
                        'name' => trim("{$class->name} {$class->stream->name}"),
                        'is_active' => true,
                    ]
                );
            });
    }

    public function down(): void
    {
        // no-op
    }
};