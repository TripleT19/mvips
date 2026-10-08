<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('application_documents', function (Blueprint $table) {

            if (!Schema::hasColumn('application_documents', 'verification_status')) {
                $table->string('verification_status')
                    ->default('pending')
                    ->after('file_size');
            }

            if (!Schema::hasColumn('application_documents', 'physical_received')) {
                $table->boolean('physical_received')
                    ->default(false)
                    ->after('verification_status');
            }

            if (!Schema::hasColumn('application_documents', 'physical_received_at')) {
                $table->timestamp('physical_received_at')
                    ->nullable()
                    ->after('physical_received');
            }

            if (!Schema::hasColumn('application_documents', 'verification_notes')) {
                $table->text('verification_notes')
                    ->nullable()
                    ->after('physical_received_at');
            }

            if (!Schema::hasColumn('application_documents', 'verified_by')) {
                $table->unsignedBigInteger('verified_by')
                    ->nullable()
                    ->after('verification_notes');
            }

            if (!Schema::hasColumn('application_documents', 'verified_at')) {
                $table->timestamp('verified_at')
                    ->nullable()
                    ->after('verified_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('application_documents', function (Blueprint $table) {
            foreach ([
                'verification_status',
                'physical_received',
                'physical_received_at',
                'verification_notes',
                'verified_by',
                'verified_at',
            ] as $column) {
                if (Schema::hasColumn('application_documents', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};