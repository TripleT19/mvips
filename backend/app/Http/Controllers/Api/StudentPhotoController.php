<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassStream;
use App\Models\Student;
use App\Models\TeacherAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentPhotoController extends Controller
{
    /**
     * Only these user roles may upload/remove photos.
     * Admins and headteachers are deliberately excluded —
     * photos are a class-teacher / teaching-assistant responsibility.
     */
    private const EDITOR_USER_ROLES = [
        'lead_teacher', 'class_teacher',
        'assistant_teacher', 'teaching_assistant', 'ta',
    ];

    /** And they must hold one of these active assignments. */
    private const EDITOR_ASSIGNMENT_ROLES = [
        TeacherAssignment::ROLE_CLASS_TEACHER,
        TeacherAssignment::ROLE_LEAD_TEACHER,
        TeacherAssignment::ROLE_ASSISTANT_TEACHER,
    ];

    /* ============================================================
     * SECTIONS this user can manage photos for
     * ============================================================ */

    public function sections(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, self::EDITOR_USER_ROLES, true)) {
            return response()->json([
                'success' => true,
                'data'    => [],
                'message' => 'Photo management is reserved for class teachers and teaching assistants.',
            ]);
        }

        $yearId = AcademicYear::where('is_current', true)->value('id');

        $assignedIds = TeacherAssignment::where('user_id', $user->id)
            ->whereIn('role', self::EDITOR_ASSIGNMENT_ROLES)
            ->where('is_active', true)
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->whereNotNull('class_stream_id')
            ->pluck('class_stream_id')
            ->unique()
            ->values();

        if ($assignedIds->isEmpty()) {
            return response()->json([
                'success' => true,
                'data'    => [],
                'message' => 'You are not assigned to a class section this academic year.',
            ]);
        }

        $sections = ClassStream::with(['schoolClass:id,name', 'stream:id,name,colour'])
            ->whereIn('id', $assignedIds)
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (ClassStream $cs) => [
                'id'                => $cs->id,
                'name'              => $cs->name,
                'school_class_name' => $cs->schoolClass?->name,
                'stream_name'       => $cs->stream?->name,
                'stream_colour'     => $cs->stream?->colour,
            ])
            ->values();

        return response()->json(['success' => true, 'data' => $sections]);
    }

    /* ============================================================
     * ROSTER — students of a section + their current photo
     * ============================================================ */

    public function roster(Request $request)
    {
        $validated = $request->validate([
            'class_stream_id' => ['required', 'integer', 'exists:class_streams,id'],
        ]);

        $classStream = ClassStream::with(['schoolClass:id,name', 'stream:id,name,colour'])
            ->findOrFail($validated['class_stream_id']);

        $this->authorizeSection($request->user(), $classStream);

        $students = Student::where('status', 'active')
            ->where(function ($q) use ($classStream) {
                $q->where('current_class_stream_id', $classStream->id)
                  ->orWhere(function ($q2) use ($classStream) {
                      $q2->whereNull('current_class_stream_id')
                         ->where('current_class_id', $classStream->school_class_id);
                  });
            })
            ->orderBy('surname')
            ->orderBy('first_name')
            ->get(['id', 'student_number', 'first_name', 'middle_name', 'surname', 'photo_path']);

        $rows = $students->map(fn (Student $s) => [
            'id'             => $s->id,
            'student_number' => $s->student_number,
            'full_name'      => trim("{$s->first_name} {$s->middle_name} {$s->surname}"),
            'photo_url'      => $s->photo_path
                ? Storage::disk('public')->url($s->photo_path)
                : null,
            'has_photo'      => (bool) $s->photo_path,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'class_stream' => [
                    'id'                => $classStream->id,
                    'name'              => $classStream->name,
                    'school_class_name' => $classStream->schoolClass?->name,
                    'stream_name'       => $classStream->stream?->name,
                ],
                'students' => $rows,
            ],
        ]);
    }

    /* ============================================================
     * UPLOAD / REPLACE
     * ============================================================ */

    public function upload(Request $request, Student $student)
    {
        $validated = $request->validate([
            'photo'           => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'class_stream_id' => ['nullable', 'integer', 'exists:class_streams,id'],
        ]);

        $classStream = $this->resolveStudentSection(
            $student,
            $validated['class_stream_id'] ?? null
        );

        abort_unless(
            $classStream,
            422,
            'Student is not attached to any class or section.'
        );

        $this->authorizeSection($request->user(), $classStream);

        // Remove old file before storing the new one
        if ($student->photo_path && Storage::disk('public')->exists($student->photo_path)) {
            Storage::disk('public')->delete($student->photo_path);
        }

        // Laravel generates a unique filename — no browser-cache collisions.
        $path = $request->file('photo')->store("students/{$student->id}", 'public');

        $student->update(['photo_path' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Photo updated.',
            'data'    => [
                'photo_url' => Storage::disk('public')->url($path),
                'photo_path' => $path,
            ],
        ]);
    }

    /* ============================================================
     * REMOVE
     * ============================================================ */

    public function destroyPhoto(Request $request, Student $student)
    {
        $validated = $request->validate([
            'class_stream_id' => ['nullable', 'integer', 'exists:class_streams,id'],
        ]);

        $classStream = $this->resolveStudentSection(
            $student,
            $validated['class_stream_id'] ?? null
        );

        abort_unless($classStream, 422, 'Student is not attached to any class or section.');
        $this->authorizeSection($request->user(), $classStream);

        if ($student->photo_path && Storage::disk('public')->exists($student->photo_path)) {
            Storage::disk('public')->delete($student->photo_path);
        }

        $student->update(['photo_path' => null]);

        return response()->json(['success' => true, 'message' => 'Photo removed.']);
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    private function authorizeSection($user, ClassStream $classStream): void
    {
        abort_unless(
            $this->canManagePhotos($user, $classStream),
            403,
            'Only the class teacher or teaching assistant assigned to this section can manage photos.'
        );
    }

    private function canManagePhotos($user, ClassStream $classStream): bool
    {
        if (!$user) return false;
        if (!in_array($user->role, self::EDITOR_USER_ROLES, true)) return false;

        $yearId = AcademicYear::where('is_current', true)->value('id');
        if (!$yearId) return false;

        return TeacherAssignment::where('user_id', $user->id)
            ->where('class_stream_id', $classStream->id)
            ->where('academic_year_id', $yearId)
            ->where('is_active', true)
            ->whereIn('role', self::EDITOR_ASSIGNMENT_ROLES)
            ->exists();
    }

    /**
     * Resolve which section the student belongs to for the current request.
     * Mirrors the logic used by AssessmentSheetController.
     */
    private function resolveStudentSection(Student $student, ?int $requestedStreamId = null): ?ClassStream
    {
        $with = ['schoolClass:id,name', 'stream:id,name,colour'];

        if ($requestedStreamId) {
            $stream = ClassStream::with($with)->find($requestedStreamId);
            if ($stream && (int) $stream->school_class_id === (int) $student->current_class_id) {
                return $stream;
            }
        }

        if ($student->current_class_stream_id) {
            $direct = ClassStream::with($with)->find($student->current_class_stream_id);
            if ($direct) return $direct;
        }

        if ($student->current_class_id) {
            return ClassStream::with($with)
                ->where('school_class_id', $student->current_class_id)
                ->where('is_active', true)
                ->orderBy('name')
                ->first();
        }

        return null;
    }
}