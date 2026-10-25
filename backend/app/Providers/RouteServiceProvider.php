use App\Models\Student;
use Illuminate\Support\Facades\Route;

public function boot(): void
{
    // Custom binding for the {student} parameter used across the app:
    //   /students/18            → resolves by ID
    //   /students/think-malawi-18 → resolves by slug
    // Everything else keeps working exactly as before because numeric
    // URLs hit the ID branch first.
    Route::bind('student', function ($value) {
        if (is_numeric($value)) {
            $student = Student::find($value);
            if ($student) return $student;
        }

        $student = Student::where('slug', $value)->first();
        if ($student) return $student;

        abort(404);
    });
}