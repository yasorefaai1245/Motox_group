<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestRide extends Model
{
    protected $fillable = [
        'motorcycle_id',
        'showroom_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'ride_date',
        'ride_time',
        'status',
        'notes',
    ];

    protected $casts = [
        'ride_date' => 'date',
    ];

    public function motorcycle(): BelongsTo
    {
        return $this->belongsTo(Motorcycle::class);
    }

    public function showroom(): BelongsTo
    {
        return $this->belongsTo(Showroom::class);
    }
}