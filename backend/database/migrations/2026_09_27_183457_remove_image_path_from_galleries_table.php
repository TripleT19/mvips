<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('galleries', 'image_path')) {
            Schema::table('galleries', function (Blueprint $table) {
                $table->dropColumn('image_path');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('galleries', 'image_path')) {
            Schema::table('galleries', function (Blueprint $table) {
                $table->string('image_path')->nullable();
            });
        }
    }
};