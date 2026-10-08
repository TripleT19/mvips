<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_applications', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | Primary Key
            |--------------------------------------------------------------------------
            */

            $table->id();


            /*
            |--------------------------------------------------------------------------
            | Application Identification
            |--------------------------------------------------------------------------
            */

            $table->string(
                'application_number',
                40
            )->unique();

            /*
            |--------------------------------------------------------------------------
            | Secure Parent/Application Tracking Token
            |--------------------------------------------------------------------------
            |
            | Only the SHA-256 hash is stored.
            |
            */

            $table->string(
                'tracking_token_hash',
                64
            )->unique();


            /*
            |--------------------------------------------------------------------------
            | Academic Year
            |--------------------------------------------------------------------------
            */

            $table->foreignId(
                'academic_year_id'
            )
                ->nullable()
                ->constrained(
                    'academic_years'
                )
                ->nullOnDelete();


            /*
            |--------------------------------------------------------------------------
            | Class Applied For
            |--------------------------------------------------------------------------
            */

            $table->foreignId(
                'class_applied_id'
            )
                ->nullable()
                ->constrained(
                    'school_classes'
                )
                ->nullOnDelete();


            /*
            |--------------------------------------------------------------------------
            | Student Information
            |--------------------------------------------------------------------------
            |
            | These are nullable because the application is initially
            | created as a draft before the student form is completed.
            |
            */

            $table->string(
                'legal_first_name'
            )->nullable();

            $table->string(
                'middle_name'
            )->nullable();

            $table->string(
                'legal_surname'
            )->nullable();

            $table->date(
                'date_of_birth'
            )->nullable();

            $table->string(
                'gender',
                30
            )->nullable();

            $table->string(
                'blood_group',
                20
            )->nullable();

            $table->decimal(
                'weight_kg',
                6,
                2
            )->nullable();

            $table->decimal(
                'height_cm',
                6,
                2
            )->nullable();

            $table->string(
                'first_language'
            )->nullable();

            $table->string(
                'nationality'
            )->nullable();

            $table->string(
                'religion'
            )->nullable();

            $table->string(
                'emergency_contact'
            )->nullable();

            $table->unsignedInteger(
                'family_member_count'
            )->nullable();

            $table->string(
                'student_lives_with'
            )->nullable();

            $table->unsignedInteger(
                'children_at_mount_view'
            )->nullable();

            $table->text(
                'physical_address'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | Student Photograph
            |--------------------------------------------------------------------------
            */

            $table->string(
                'student_photo_path'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | Previous School
            |--------------------------------------------------------------------------
            */

            $table->string(
                'previous_school_name'
            )->nullable();

            $table->text(
                'previous_school_address'
            )->nullable();

            $table->string(
                'previous_class'
            )->nullable();

            $table->string(
                'previous_year'
            )->nullable();

            $table->text(
                'reason_for_leaving'
            )->nullable();

            $table->string(
                'previous_school_contact'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | Application Status
            |--------------------------------------------------------------------------
            */

            $table->string(
                'status',
                40
            )->default('draft');

            $table->string(
                'source',
                30
            )->default('online');


            /*
            |--------------------------------------------------------------------------
            | Internal Notes
            |--------------------------------------------------------------------------
            */

            $table->text(
                'parent_notes'
            )->nullable();

            $table->text(
                'admissions_notes'
            )->nullable();

            $table->text(
                'principal_comments'
            )->nullable();

            $table->text(
                'administrator_comments'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | Submission
            |--------------------------------------------------------------------------
            */

            $table->boolean(
                'submitted'
            )->default(false);

            $table->timestamp(
                'submitted_at'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | Physical File
            |--------------------------------------------------------------------------
            */

            $table->string(
                'physical_file_status',
                30
            )->default('not_received');

            $table->timestamp(
                'physical_file_received_at'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | Enrollment
            |--------------------------------------------------------------------------
            */

            $table->timestamp(
                'enrolled_at'
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
            */

            $table->index([
                'status',
                'academic_year_id',
            ]);

            $table->index(
                'class_applied_id'
            );

            $table->index(
                'physical_file_status'
            );

            $table->index(
                'submitted_at'
            );
        });
    }


    public function down(): void
    {
        Schema::dropIfExists(
            'admission_applications'
        );
    }
};
