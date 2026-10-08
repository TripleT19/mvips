<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolClass extends Model {
    use HasFactory;
    protected $table = 'school_classes';
    protected $fillable = ['name','code','sort_order','is_active'];
    protected $casts = ['sort_order'=>'integer','is_active'=>'boolean'];
    public function applications(): HasMany { return $this->hasMany(AdmissionApplication::class,'class_applied_id'); }
    public function students(): HasMany { return $this->hasMany(Student::class,'current_class_id'); }
}
