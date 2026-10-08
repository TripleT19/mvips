<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('terms_acceptances', function (Blueprint $table) {

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
            | Terms Condition
            |--------------------------------------------------------------------------
            */

            $table->foreignId(
                'terms_condition_id'
            )
                ->constrained(
                    'terms_conditions'
                )
                ->cascadeOnDelete();


            /*
            |--------------------------------------------------------------------------
            | Acceptance
            |--------------------------------------------------------------------------
            */

            $table->boolean(
                'accepted'
            )->default(false);

            $table->timestamp(
                'accepted_at'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | IP / Audit Information
            |--------------------------------------------------------------------------
            */

            $table->string(
                'ip_address',
                45
            )->nullable();

            $table->text(
                'user_agent'
            )->nullable();


            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            $table->timestamps();


            /*
            |--------------------------------------------------------------------------
            | Unique Constraint
            |--------------------------------------------------------------------------
            |
            | Prevents the same application from accepting the same
            | terms condition more than once.
            |
            | Explicit short name avoids MySQL's 64-character
            | identifier limit.
            |
            */

            $table->unique(
                [
                    'admission_application_id',
                    'terms_condition_id',
                ],
                'terms_app_condition_unique'
            );


            /*
            |--------------------------------------------------------------------------
            | Additional Indexes
            |--------------------------------------------------------------------------
            */

            $table->index(
                'admission_application_id',
                'terms_app_idx'
            );

            $table->index(
                'terms_condition_id',
                'terms_condition_idx'
            );

            $table->index(
                'accepted_at',
                'terms_accepted_at_idx'
            );
        });
    }


    public function down(): void
    {
        Schema::dropIfExists(
            'terms_acceptances'
        );
    }
};
