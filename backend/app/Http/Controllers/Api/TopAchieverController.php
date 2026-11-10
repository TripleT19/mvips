<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\TopAchiever;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TopAchieverController extends Controller
{
    private const MAX_SUBJECT = 50;
    private const MAX_TOTAL   = 150;

    /* =========================================================
       PUBLIC
    ========================================================= */

    public function publicIndex(Request $request)
    {
        $yearIds = TopAchiever::published()
            ->select('academic_year_id')
            ->distinct()
            ->pluck('academic_year_id')
            ->toArray();

        $years = AcademicYear::whereIn('id', $yearIds)
            ->orderByDesc('name')
            ->get(['id', 'name', 'is_current'])
            ->map(fn ($y) => [
                'id'         => $y->id,
                'name'       => $y->name,
                'is_current' => (bool) $y->is_current,
            ])
            ->toArray();

        $yearId = $request->input('academic_year_id');
        if (! $yearId) {
            $currentYear = AcademicYear::where('is_current', true)->first();
            $yearId = ($currentYear && in_array($currentYear->id, $yearIds))
                ? $currentYear->id
                : ($years[0]['id'] ?? null);
        }

        $emptyResponse = [
            'success' => true,
            'data'    => [
                'class_level'   => [],
                'subject_level' => [
                    'english' => [],
                    'maths'   => [],
                    'science' => [],
                ],
            ],
            'years'              => $years,
            'academic_year_id'   => null,
            'academic_year_name' => null,
            'max_subject'        => self::MAX_SUBJECT,
            'max_total'          => self::MAX_TOTAL,
            'summary'            => [
                'class_total'    => 0,
                'subject_totals' => ['english' => 0, 'maths' => 0, 'science' => 0],
                'best_english'   => 0,
                'best_maths'     => 0,
                'best_science'   => 0,
                'best_total'     => 0,
                'best_average'   => 0,
            ],
        ];

        if (! $yearId) {
            return response()->json($emptyResponse);
        }

        $all = TopAchiever::with('academicYear:id,name')
            ->where('academic_year_id', $yearId)
            ->published()
            ->orderBy('position')
            ->orderByDesc('total_score')
            ->get();

        $classLevel = $all->whereNull('subject')
            ->values()
            ->map(fn (TopAchiever $a) => $this->format($a))
            ->toArray();

        $subjectLevel = [];
        foreach (TopAchiever::SUBJECTS as $subject) {
            $subjectLevel[$subject] = $all
                ->where('subject', $subject)
                ->values()
                ->map(fn (TopAchiever $a) => $this->format($a))
                ->toArray();
        }

        $bestEnglish = collect($subjectLevel['english'])->max('total_score') ?? 0;
        $bestMaths   = collect($subjectLevel['maths'])->max('total_score') ?? 0;
        $bestScience = collect($subjectLevel['science'])->max('total_score') ?? 0;
        $bestTotal   = collect($classLevel)->max('total_score') ?? 0;
        $bestAverage = collect($classLevel)->max('average_score') ?? 0;

        $yearName = AcademicYear::where('id', $yearId)->value('name');

        return response()->json([
            'success' => true,
            'data'    => [
                'class_level'   => $classLevel,
                'subject_level' => $subjectLevel,
            ],
            'years'              => $years,
            'academic_year_id'   => $yearId,
            'academic_year_name' => $yearName,
            'max_subject'        => self::MAX_SUBJECT,
            'max_total'          => self::MAX_TOTAL,
            'summary'            => [
                'class_total'    => count($classLevel),
                'subject_totals' => [
                    'english' => count($subjectLevel['english']),
                    'maths'   => count($subjectLevel['maths']),
                    'science' => count($subjectLevel['science']),
                ],
                'best_english'   => (float) $bestEnglish,
                'best_maths'     => (float) $bestMaths,
                'best_science'   => (float) $bestScience,
                'best_total'     => (float) $bestTotal,
                'best_average'   => (float) $bestAverage,
            ],
        ]);
    }

    /* =========================================================
       ADMIN
    ========================================================= */

    public function index(Request $request)
    {
        $yearId = $request->input('academic_year_id');
        if (! $yearId) {
            $currentYear = AcademicYear::where('is_current', true)->first()
                ?? AcademicYear::orderByDesc('name')->first();
            $yearId = $currentYear?->id;
        }

        $subject = $request->input('subject'); // null | english | maths | science

        $query = TopAchiever::where('academic_year_id', $yearId);
        if ($subject === null) {
            $query->whereNull('subject');
        } else {
            $query->where('subject', $subject);
        }
        $query->orderBy('position')->orderByDesc('total_score');

        $data = $query->get()->map(fn (TopAchiever $a) => $this->format($a))->toArray();

        // Counts across the year (all subjects)
        $counts = [
            'class'   => TopAchiever::where('academic_year_id', $yearId)->whereNull('subject')->count(),
            'english' => TopAchiever::where('academic_year_id', $yearId)->where('subject', 'english')->count(),
            'maths'   => TopAchiever::where('academic_year_id', $yearId)->where('subject', 'maths')->count(),
            'science' => TopAchiever::where('academic_year_id', $yearId)->where('subject', 'science')->count(),
        ];

        return response()->json([
            'success'          => true,
            'data'             => $data,
            'academic_year_id' => $yearId,
            'subject'          => $subject,
            'years'            => AcademicYear::orderByDesc('name')
                ->get(['id', 'name', 'is_current']),
            'max_subject'      => self::MAX_SUBJECT,
            'max_total'        => self::MAX_TOTAL,
            'counts'           => $counts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'student_name'     => ['required', 'string', 'max:150'],
            'subject'          => ['nullable', 'in:english,maths,science'],
            'score'            => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'english_score'    => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'maths_score'      => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'science_score'    => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'note'             => ['nullable', 'string', 'max:500'],
            'is_published'     => ['nullable', 'boolean'],
            'photo'            => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $subject = $validated['subject'] ?? null;
        $scores  = $this->resolveScores($subject, $validated);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('top-achievers', 'public');
        }

        $achiever = TopAchiever::create([
            'academic_year_id'   => $validated['academic_year_id'],
            'student_name'       => trim($validated['student_name']),
            'student_photo_path' => $photoPath,
            'position'           => 0, // will be recalculated
            'subject'            => $subject,
            'english_score'      => $scores['english'],
            'maths_score'        => $scores['maths'],
            'science_score'      => $scores['science'],
            'note'               => $validated['note'] ?? null,
            'is_published'       => $request->boolean('is_published', true),
            'created_by'         => $request->user()?->id,
        ]);

        $this->recalculatePositions((int) $validated['academic_year_id'], $subject);

        return response()->json([
            'success' => true,
            'message' => 'Top achiever created successfully.',
            'data'    => $this->format($achiever->fresh()),
        ], 201);
    }

    public function storeBatch(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id'          => ['required', 'integer', 'exists:academic_years,id'],
            'subject'                   => ['nullable', 'in:english,maths,science'],
            'achievers'                 => ['required', 'array', 'min:1'],
            'achievers.*.student_name'  => ['required', 'string', 'max:150'],
            'achievers.*.note'          => ['nullable', 'string', 'max:500'],
            'achievers.*.score'         => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'achievers.*.english_score' => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'achievers.*.maths_score'   => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'achievers.*.science_score' => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'achievers.*.photo'         => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ], [
            'achievers.*.score.max'         => 'Each subject score must not exceed ' . self::MAX_SUBJECT . '.',
            'achievers.*.english_score.max' => 'English score must not exceed ' . self::MAX_SUBJECT . '.',
            'achievers.*.maths_score.max'   => 'Mathematics score must not exceed ' . self::MAX_SUBJECT . '.',
            'achievers.*.science_score.max' => 'Science score must not exceed ' . self::MAX_SUBJECT . '.',
        ]);

        $subject = $validated['subject'] ?? null;
        $yearId  = (int) $validated['academic_year_id'];
        $created = 0;

        DB::transaction(function () use ($request, $validated, $subject, $yearId, &$created) {
            foreach ($validated['achievers'] as $index => $row) {
                if (empty(trim($row['student_name'] ?? ''))) {
                    continue;
                }

                $scores = $this->resolveScores($subject, $row);

                $photoPath = null;
                if ($request->hasFile("achievers.{$index}.photo")) {
                    $photoPath = $request
                        ->file("achievers.{$index}.photo")
                        ->store('top-achievers', 'public');
                }

                TopAchiever::create([
                    'academic_year_id'   => $yearId,
                    'student_name'       => trim($row['student_name']),
                    'student_photo_path' => $photoPath,
                    'position'           => 0,
                    'subject'            => $subject,
                    'english_score'      => $scores['english'],
                    'maths_score'        => $scores['maths'],
                    'science_score'      => $scores['science'],
                    'note'               => $row['note'] ?? null,
                    'is_published'       => true,
                    'created_by'         => $request->user()?->id,
                ]);
                $created++;
            }
        });

        $this->recalculatePositions($yearId, $subject);

        return response()->json([
            'success' => true,
            'message' => "{$created} achiever" . ($created === 1 ? '' : 's') . ' added successfully.',
            'count'   => $created,
        ], 201);
    }

    public function update(Request $request, TopAchiever $topAchiever)
    {
        $validated = $request->validate([
            'student_name'     => ['required', 'string', 'max:150'],
            'subject'          => ['nullable', 'in:english,maths,science'],
            'score'            => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'english_score'    => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'maths_score'      => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'science_score'    => ['nullable', 'numeric', 'min:0', 'max:' . self::MAX_SUBJECT],
            'note'             => ['nullable', 'string', 'max:500'],
            'is_published'     => ['nullable', 'boolean'],
            'photo'            => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_photo'     => ['nullable', 'boolean'],
        ]);

        $previousSubject = $topAchiever->subject;
        $newSubject      = $validated['subject'] ?? null;
        $scores          = $this->resolveScores($newSubject, $validated);

        $topAchiever->student_name    = trim($validated['student_name']);
        $topAchiever->subject         = $newSubject;
        $topAchiever->english_score   = $scores['english'];
        $topAchiever->maths_score     = $scores['maths'];
        $topAchiever->science_score   = $scores['science'];
        $topAchiever->note            = $validated['note'] ?? null;
        $topAchiever->is_published    = $request->boolean('is_published', $topAchiever->is_published);

        if ($request->boolean('remove_photo') && $topAchiever->student_photo_path) {
            Storage::disk('public')->delete($topAchiever->student_photo_path);
            $topAchiever->student_photo_path = null;
        }
        if ($request->hasFile('photo')) {
            if ($topAchiever->student_photo_path) {
                Storage::disk('public')->delete($topAchiever->student_photo_path);
            }
            $topAchiever->student_photo_path = $request
                ->file('photo')
                ->store('top-achievers', 'public');
        }

        $topAchiever->save();

        // Recalculate both the old and new group (subject may have changed)
        $yearId = (int) $topAchiever->academic_year_id;
        $this->recalculatePositions($yearId, $previousSubject);
        if ($previousSubject !== $newSubject) {
            $this->recalculatePositions($yearId, $newSubject);
        }

        return response()->json([
            'success' => true,
            'message' => 'Top achiever updated successfully.',
            'data'    => $this->format($topAchiever->fresh()),
        ]);
    }

    public function destroy(TopAchiever $topAchiever)
    {
        $yearId  = (int) $topAchiever->academic_year_id;
        $subject = $topAchiever->subject;

        if ($topAchiever->student_photo_path) {
            Storage::disk('public')->delete($topAchiever->student_photo_path);
        }
        $topAchiever->delete();

        $this->recalculatePositions($yearId, $subject);

        return response()->json([
            'success' => true,
            'message' => 'Top achiever deleted successfully.',
        ]);
    }

    /* =========================================================
       HELPERS
    ========================================================= */

    /**
     * Map input fields to the three score columns based on mode.
     */
    private function resolveScores(?string $subject, array $row): array
    {
        $english = 0;
        $maths   = 0;
        $science = 0;

        if ($subject === null) {
            $english = (float) ($row['english_score'] ?? 0);
            $maths   = (float) ($row['maths_score']   ?? 0);
            $science = (float) ($row['science_score'] ?? 0);
        } elseif ($subject === 'english') {
            $english = (float) ($row['score'] ?? $row['english_score'] ?? 0);
        } elseif ($subject === 'maths') {
            $maths = (float) ($row['score'] ?? $row['maths_score'] ?? 0);
        } elseif ($subject === 'science') {
            $science = (float) ($row['score'] ?? $row['science_score'] ?? 0);
        }

        // Clamp to [0, 50]
        $clamp = fn ($v) => max(0, min((float) self::MAX_SUBJECT, (float) $v));
        return [
            'english' => $clamp($english),
            'maths'   => $clamp($maths),
            'science' => $clamp($science),
        ];
    }

    /**
     * Recalculate 1..N positions for a (year, subject) group.
     * Ties share a position (standard competition ranking).
     */
    private function recalculatePositions(int $yearId, ?string $subject): void
    {
        $query = TopAchiever::where('academic_year_id', $yearId);
        if ($subject === null) {
            $query->whereNull('subject');
        } else {
            $query->where('subject', $subject);
        }
        $rows = $query->orderByDesc('total_score')->orderBy('id')->get();

        $prevScore = null;
        $prevPos   = 0;
        $i         = 0;

        foreach ($rows as $achiever) {
            $i++;
            $score = (float) $achiever->total_score;

            if ($prevScore !== null && $score === $prevScore) {
                $newPos = $prevPos;
            } else {
                $newPos  = $i;
                $prevPos = $i;
                $prevScore = $score;
            }

            if ((int) $achiever->position !== $newPos) {
                $achiever->position = $newPos;
                $achiever->saveQuietly();
            }
        }
    }

    private function format(TopAchiever $a): array
    {
        return [
            'id'                 => $a->id,
            'academic_year_id'   => $a->academic_year_id,
            'academic_year_name' => $a->academicYear?->name,
            'student_name'       => $a->student_name,
            'student_photo_url'  => $a->student_photo_url,
            'position'           => (int) $a->position,
            'subject'            => $a->subject,
            'english_score'      => (float) $a->english_score,
            'maths_score'        => (float) $a->maths_score,
            'science_score'      => (float) $a->science_score,
            'total_score'        => (float) $a->total_score,
            'average_score'      => (float) $a->average_score,
            'note'               => $a->note,
            'is_published'       => (bool) $a->is_published,
            'created_at'         => $a->created_at,
        ];
    }
}