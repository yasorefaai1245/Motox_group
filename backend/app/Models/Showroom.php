<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Showroom extends Model
{
    protected $fillable = [
        'city',
        'address',
        'phone',
        'type',
        'opening_hours',
        'image',
        'status',
    ];

    public function brands(): BelongsToMany
    {
        return $this->belongsToMany(Brand::class);
    }

    public function testRides(): HasMany
    {
        return $this->hasMany(TestRide::class);
    }
}