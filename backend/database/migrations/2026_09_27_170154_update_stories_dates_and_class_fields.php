<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->string('class_name')
                ->nullable()
                ->change();

            $table->date('event_date')
                ->nullable()
                ->change();

            $table->timestamp('published_date')
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        //
    }
};