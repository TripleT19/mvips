<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HousePoint extends Model
{
    protected $fillable = ['house_id', 'academic_year_id', 'points'];

    public function house()
    {
        return $this->belongsTo(House::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}