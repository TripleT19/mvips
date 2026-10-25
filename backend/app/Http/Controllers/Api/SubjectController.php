<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Subject::query();

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('code', 'like', "%{$s}%");
            });
        }

        if ($request->filled('group')) {
            $query->where('subject_group', $request->input('group'));
        }

        if ($request->filled('status')) {
            $query->where(
                'is_active',
                $request->input('status') === 'active'
            );
        }

        $subjects = $query
            ->orderBy('subject_group')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $subjects,
            'groups' => [
                'core' => Subject::where('subject_group', 'core')->count(),
                'specialist' => Subject::where('subject_group', 'specialist')->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:30', 'unique:subjects,code'],
            'subject_group' => ['required', Rule::in(['core', 'specialist'])],
            'max_marks' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $subject = Subject::create([
            'name' => trim($validated['name']),
            'code' => strtoupper(trim($validated['code'])),
            'subject_group' => $validated['subject_group'],
            'max_marks' => $validated['max_marks']
                ?? ($validated['subject_group'] === 'core' ? 100 : 50),
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subject created successfully.',
            'data' => $subject,
        ], 201);
    }

    public function show(Subject $subject)
    {
        return response()->json([
            'success' => true,
            'data' => $subject,
        ]);
    }

    public function update(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => [
                'required',
                'string',
                'max:30',
                Rule::unique('subjects', 'code')->ignore($subject->id),
            ],
            'subject_group' => ['required', Rule::in(['core', 'specialist'])],
            'max_marks' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $subject->update([
            'name' => trim($validated['name']),
            'code' => strtoupper(trim($validated['code'])),
            'subject_group' => $validated['subject_group'],
            'max_marks' => $validated['max_marks'] ?? $subject->max_marks,
            'sort_order' => $validated['sort_order'] ?? $subject->sort_order,
            'is_active' => $validated['is_active'] ?? $subject->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subject updated successfully.',
            'data' => $subject->fresh(),
        ]);
    }

    public function destroy(Subject $subject)
    {
        // Prevent deleting a subject that's in use
        if ($subject->classSubjects()->exists()
            || $subject->assignments()->where('is_active', true)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This subject is currently used by classes or teachers. Deactivate it instead of deleting.',
            ], 422);
        }

        $subject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subject deleted successfully.',
        ]);
    }
}