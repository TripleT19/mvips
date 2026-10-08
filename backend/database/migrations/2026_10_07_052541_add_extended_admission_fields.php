<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admission_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('admission_applications', 'siblings_at_mount_view')) {
                $table->json('siblings_at_mount_view')->nullable()->after('children_at_mount_view');
            }
            if (!Schema::hasColumn('admission_applications', 'medical_conditions')) {
                $table->text('medical_conditions')->nullable()->after('physical_address');
            }
            if (!Schema::hasColumn('admission_applications', 'allergies')) {
                $table->text('allergies')->nullable()->after('medical_conditions');
            }
            if (!Schema::hasColumn('admission_applications', 'learning_needs')) {
                $table->text('learning_needs')->nullable()->after('allergies');
            }
            if (!Schema::hasColumn('admission_applications', 'family_doctor_name')) {
                $table->string('family_doctor_name')->nullable()->after('learning_needs');
            }
            if (!Schema::hasColumn('admission_applications', 'family_doctor_phone')) {
                $table->string('family_doctor_phone')->nullable()->after('family_doctor_name');
            }
            if (!Schema::hasColumn('admission_applications', 'previous_school_country')) {
                $table->string('previous_school_country')->nullable()->after('previous_school_contact');
            }
            if (!Schema::hasColumn('admission_applications', 'previous_school_language')) {
                $table->string('previous_school_language')->nullable()->after('previous_school_country');
            }
        });

        Schema::table('application_parents', function (Blueprint $table) {
            if (!Schema::hasColumn('application_parents', 'position_title')) {
                $table->string('position_title')->nullable()->after('occupation');
            }
            if (!Schema::hasColumn('application_parents', 'work_address')) {
                $table->text('work_address')->nullable()->after('position_title');
            }
            if (!Schema::hasColumn('application_parents', 'work_phone')) {
                $table->string('work_phone')->nullable()->after('work_address');
            }
            if (!Schema::hasColumn('application_parents', 'employer_pays_fees')) {
                $table->boolean('employer_pays_fees')->default(false)->after('work_phone');
            }
            if (!Schema::hasColumn('application_parents', 'employer_payment_percentage')) {
                $table->unsignedTinyInteger('employer_payment_percentage')->nullable()->after('employer_pays_fees');
            }
        });
    }

    public function down(): void
    {
        Schema::table('admission_applications', function (Blueprint $table) {
            foreach ([
                'siblings_at_mount_view',
                'medical_conditions',
                'allergies',
                'learning_needs',
                'family_doctor_name',
                'family_doctor_phone',
                'previous_school_country',
                'previous_school_language',
            ] as $col) {
                if (Schema::hasColumn('admission_applications', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('application_parents', function (Blueprint $table) {
            foreach ([
                'position_title',
                'work_address',
                'work_phone',
                'employer_pays_fees',
                'employer_payment_percentage',
            ] as $col) {
                if (Schema::hasColumn('application_parents', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};