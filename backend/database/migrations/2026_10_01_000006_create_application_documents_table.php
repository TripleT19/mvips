<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_documents', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | Primary Key
            |--------------------------------------------------------------------------
            */

            $table->id();


            /*
            |--------------------------------------------------------------------------
            | Admission Application
            |--------------------------------------------------------------------------
            */

            $table->foreignId(
                'admission_application_id'
            )
                ->constrained(
                    'admission_applications'
                )
                ->cascadeOnDelete();


            /*
            |--------------------------------------------------------------------------
            | Document
            |--------------------------------------------------------------------------
            */

            $table->string(
                'document_type',
                50
            );

            $table->string(
                'original_name'
            );

            $table->string(
                'file_path'
            );

            $table->string(
                'mime_type'
            )->nullable();

            $table->unsignedBigInteger(
                'file_size'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | Digital Status
            |--------------------------------------------------------------------------
            */

            $table->string(
                'digital_status',
                30
            )->default('uploaded');


            /*
            |--------------------------------------------------------------------------
            | Physical Status
            |--------------------------------------------------------------------------
            */

            $table->string(
                'physical_status',
                30
            )->default('pending');


            /*
            |--------------------------------------------------------------------------
            | Physical File
            |--------------------------------------------------------------------------
            */

            $table->timestamp(
                'physical_received_at'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | Verification
            |--------------------------------------------------------------------------
            */

            $table->string(
                'verification_status',
                30
            )->default('pending');

            $table->foreignId(
                'verified_by'
            )
                ->nullable()
                ->constrained(
                    'users'
                )
                ->nullOnDelete();

            $table->timestamp(
                'verified_at'
            )->nullable();

            $table->text(
                'verification_notes'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            $table->timestamps();


            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            |
            | Explicit short names prevent MySQL's 64-character
            | index-name limit.
            |
            */

            $table->index(
                [
                    'admission_application_id',
                    'document_type',
                ],
                'app_docs_app_type_idx'
            );

            $table->index(
                'verification_status',
                'app_docs_verify_idx'
            );

            $table->index(
                'physical_status',
                'app_docs_physical_idx'
            );

            $table->index(
                'digital_status',
                'app_docs_digital_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'application_documents'
        );
    }
};
