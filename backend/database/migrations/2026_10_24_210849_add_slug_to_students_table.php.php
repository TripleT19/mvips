<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add the column (nullable so the backfill has somewhere to go)
        Schema::table('students', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('student_number');
        });

        // 2. Backfill every existing student: {name-slug}-{id}
        DB::table('students')->orderBy('id')->chunk(100, function ($students) {
            foreach ($students as $student) {
                if (!empty($student->slug)) continue;

                $base = Str::slug(trim(
                    ($student->first_name ?? '') . ' ' .
                    ($student->middle_name ?? '') . ' ' .
                    ($student->surname ?? '')
                ));

                if ($base === '') {
                    $base = 'student';
                }

                DB::table('students')
                    ->where('id', $student->id)
                    ->update(['slug' => "{$base}-{$student->id}"]);
            }
        });

        // 3. Unique index — only after backfill so there are no NULLs
        Schema::table('students', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};