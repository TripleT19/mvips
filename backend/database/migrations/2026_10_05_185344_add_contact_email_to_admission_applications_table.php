<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admission_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('admission_applications', 'contact_email')) {
                $table->string('contact_email')
                    ->nullable()
                    ->after('application_number');
                $table->index('contact_email');
            }
        });
    }

    public function down(): void
    {
        Schema::table('admission_applications', function (Blueprint $table) {
            if (Schema::hasColumn('admission_applications', 'contact_email')) {
                $table->dropIndex(['contact_email']);
                $table->dropColumn('contact_email');
            }
        });
    }
};