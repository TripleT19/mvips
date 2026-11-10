<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('top_achievers', function (Blueprint $table) {
            $table->string('subject', 20)->nullable()->after('position');
            $table->index(['academic_year_id', 'subject', 'is_published'], 'ta_year_subject_pub_idx');
        });
    }

    public function down(): void
    {
        Schema::table('top_achievers', function (Blueprint $table) {
            $table->dropIndex('ta_year_subject_pub_idx');
            $table->dropColumn('subject');
        });
    }
};