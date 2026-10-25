<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\ClassStream;
use App\Models\Club;
use App\Models\SchoolClass;
use App\Models\Stream;
use App\Models\Subject;
use App\Models\User;
use App\Support\TeacherRoles;
use Illuminate\Http\Request;

class AcademicLookupController extends Controller
{
    public function index(Request $request)
    {
        $teachers = User::where('is_active', true)
            ->whereIn('role', TeacherRoles::ALL)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role'])
            ->map(fn (User $u) => [
                'id'             => $u->id,
                'name'           => $u->name,
                'email'          => $u->email,
                'role'           => $u->role,
                'is_specialist'  => TeacherRoles::isSpecialist($u->role),
                'is_class_level' => TeacherRoles::isClassLevel($u->role),
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'teachers' => $teachers,

                'classes' => SchoolClass::where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['id', 'name', 'code']),

                'class_streams' => ClassStream::with([
                    'stream:id,name,code,colour',
                    'schoolClass:id,name',
                ])
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'school_class_id', 'stream_id', 'name']),

                'streams' => Stream::where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['id', 'name', 'code', 'colour']),

                'years' => AcademicYear::orderByDesc('is_current')
                    ->orderByDesc('name')
                    ->get(['id', 'name', 'start_date', 'end_date', 'is_current', 'is_active']),

                'terms' => AcademicTerm::with('academicYear:id,name')
                    ->orderByDesc('is_current')
                    ->orderBy('academic_year_id')
                    ->orderBy('name')
                    ->get(),

                'clubs' => Club::where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['id', 'name', 'colour']),

                'subjects' => Subject::where('is_active', true)
                    ->orderBy('subject_group')
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get([
                        'id', 'name', 'code', 'subject_group',
                        'max_marks', 'sort_order', 'is_active',
                    ]),
            ],
        ]);
    }
}